import { Money } from '@/core/domain/value-objects/money'
import { Percentage } from '@/core/domain/value-objects/percentage'

export interface CommissionSourceInput<Meta = unknown> {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  baseAmount: Money
  commissionPercentage: Percentage
  alreadyPaid?: Money
  meta?: Meta
}

export interface CommissionCalculationItem<Meta = unknown> {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  amount: Money
  baseAmount: Money
  commissionPercentage: Percentage
  alreadyPaid: Money
  commissionValue: Money
  meta?: Meta
}

export interface CommissionCalculationResult<Meta = unknown> {
  totalCommission: Money
  items: CommissionCalculationItem<Meta>[]
}

export class CommissionCalculator {
  calculate<Meta = unknown>(
    sources: CommissionSourceInput<Meta>[],
  ): CommissionCalculationResult<Meta> {
    const items: CommissionCalculationItem<Meta>[] = []

    for (const source of sources) {
      const baseAmount = source.baseAmount
      const alreadyPaid = source.alreadyPaid ?? Money.zero()
      const commissionValue = baseAmount.percentage(source.commissionPercentage)
      const remaining = commissionValue.subtract(alreadyPaid).clampZero()

      if (remaining.toNumber() <= 0) continue

      items.push({
        saleId: source.saleId,
        saleItemId: source.saleItemId,
        appointmentServiceId: source.appointmentServiceId,
        baseAmount,
        commissionPercentage: source.commissionPercentage,
        alreadyPaid,
        commissionValue,
        amount: remaining,
        meta: source.meta,
      })
    }

    const totalCommission = items.reduce(
      (total, item) => total.add(item.amount),
      Money.zero(),
    )

    return {
      totalCommission,
      items,
    }
  }
}
