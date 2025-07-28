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
  ) {}

  async execute({ debtId, userId }: PayDebtRequest): Promise<PayDebtResponse> {
    const debt = await this.debtRepo.findById(debtId)
    if (!debt) throw new Error('Debt not found')
    if (debt.status === PaymentStatus.PAID) throw new Error('Debt already paid')

    const planProfile = await this.planProfileRepo.findById(debt.planProfileId)
    if (!planProfile) throw new Error('Plan profile not found')

    const saleItem = await this.saleItemRepo.findById(planProfile.saleItemId)
    if (!saleItem) throw new Error('Sale item not found')

    const incUnit = new IncrementBalanceUnitService(this.unitRepo)
    const amountToCredit = debt.value
    let transactionIncrementUnit:
      | IncrementBalanceUnitResponse['transaction']
      | undefined
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

      await this.debtRepo.update(
        debt.id,
        {
          status: PaymentStatus.PAID,
          paymentDate: new Date(),
        },
        tx,
      )

      if (planProfile.status === PlanProfileStatus.EXPIRED) {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const debts = await this.debtRepo.findMany({
          planProfileId: planProfile.id,
        })
        const hasOverdue = debts.some(
          (d) =>
            d.status !== PaymentStatus.PAID &&
            d.paymentDate.getTime() < today.getTime(),
        )
        if (!hasOverdue) {
          await this.planProfileRepo.update(
            planProfile.id,
            { status: PlanProfileStatus.PAID },
            tx,
          )
        }
      }
    })

    return { transaction: transactionIncrementUnit }
  }
}
