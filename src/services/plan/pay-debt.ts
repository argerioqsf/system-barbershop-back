import { DebtRepository } from '@/repositories/debt-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  IncrementBalanceUnitResponse,
  IncrementBalanceUnitService,
} from '../unit/increment-balance'
import { PaymentStatus, Transaction, PlanProfileStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { PlanRepository } from '@/repositories/plan-repository'
import { getLastDebtPaid, hasPendingDebts } from './utils/helpers'
import { checkAndRecalculateAffectedSales } from '../sale/utils/item'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { ProfilesRepository } from '@/repositories/profiles-repository'

interface PayDebtRequest {
  debtId: string
  userId: string
}

interface PayDebtResponse {
  transaction?: Transaction
}

export class PayDebtService {
  constructor(
    private debtRepo: DebtRepository,
    private planProfileRepo: PlanProfileRepository,
    private saleItemRepo: SaleItemRepository,
    private unitRepo: UnitRepository,
    private planRepo: PlanRepository,
    private recalcService: RecalculateUserSalesService,
    private profilesRepo: ProfilesRepository,
  ) {}

  async execute({ debtId, userId }: PayDebtRequest): Promise<PayDebtResponse> {
    const debt = await this.debtRepo.findById(debtId)
    if (!debt) throw new Error('Debt not found')
    if (debt.status === PaymentStatus.PAID) throw new Error('Debt already paid')

    const planProfile = await this.planProfileRepo.findById(debt.planProfileId)
    if (!planProfile) throw new Error('Plan profile not found')

    const saleItem = await this.saleItemRepo.findById(planProfile.saleItemId)
    if (!saleItem) throw new Error('Sale item not found')

    const plan = await this.planRepo.findByIdWithRecurrence(planProfile.planId)
    if (!plan) throw new Error('Plan not found')

    if (
      planProfile.status === PlanProfileStatus.CANCELED_ACTIVE ||
      planProfile.status === PlanProfileStatus.CANCELED_EXPIRED
    ) {
      throw new Error('It is not allowed to pay debts for canceled plans')
    }

    const incUnit = new IncrementBalanceUnitService(this.unitRepo)
    const amountToCredit = debt.value
    let transactionIncrementUnit:
      | IncrementBalanceUnitResponse['transaction']
      | undefined

    await this.debtRepo.update(debt.id, {
      status: PaymentStatus.PAID,
      paymentDate: new Date(),
    })
    await prisma.$transaction(async (tx) => {
      const { transaction } = await incUnit.execute(
        saleItem.sale.unitId,
        userId,
        amountToCredit,
        undefined,
        false,
        undefined,
        'Pay plan debt',
        tx,
      )
      transactionIncrementUnit = transaction

      const updatedDebts = await this.debtRepo.findMany({
        planProfileId: planProfile.id,
      })
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const lastDebtPaid = getLastDebtPaid(updatedDebts)
      if (!lastDebtPaid) throw new Error('there are no paid debts')

      if (planProfile.status === PlanProfileStatus.DEFAULTED) {
        const hasDebtsPending = hasPendingDebts(updatedDebts)
        if (!hasDebtsPending) {
          await this.planProfileRepo.update(
            planProfile.id,
            { status: PlanProfileStatus.PAID, dueDayDebt: today.getDate() },
            tx,
          )
          await checkAndRecalculateAffectedSales(
            planProfile.profileId,
            this.recalcService,
            this.profilesRepo,
            tx,
          )
        }
      }

      // verificar se é mais vantagem implementar logo toda a logica de debitos recorrentes ou não

      if (planProfile.status === PlanProfileStatus.EXPIRED) {
        const hasDebtsPending = hasPendingDebts(updatedDebts)
        if (!hasDebtsPending) {
          await this.planProfileRepo.update(
            planProfile.id,
            { status: PlanProfileStatus.PAID, dueDayDebt: today.getDate() },
            tx,
          )
          await checkAndRecalculateAffectedSales(
            planProfile.profileId,
            this.recalcService,
            this.profilesRepo,
            tx,
          )
        }
      }
    })

    return { transaction: transactionIncrementUnit }
  }
}
