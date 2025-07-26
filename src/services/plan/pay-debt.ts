import { DebtRepository } from '@/repositories/debt-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { PaymentStatus, Transaction } from '@prisma/client'

interface PayDebtRequest {
  debtId: string
  userId: string
}

interface PayDebtResponse {
  transaction: Transaction
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

    const profile = await this.planProfileRepo.findById(debt.planProfileId)
    if (!profile) throw new Error('Plan profile not found')

    const saleItem = (
      await this.saleItemRepo.findMany({ id: profile.saleItemId })
    )[0]
    if (!saleItem) throw new Error('Sale item not found')

    const incUnit = new IncrementBalanceUnitService(this.unitRepo)
    const amountToCredit = saleItem.price ?? debt.value
    const { transaction } = await incUnit.execute(
      saleItem.sale.unitId,
      userId,
      amountToCredit,
      undefined,
      false,
      undefined,
      'Pay plan debt',
    )

    await this.debtRepo.update(debt.id, {
      status: PaymentStatus.PAID,
      paymentDate: new Date(),
    })

    return { transaction }
  }
}
