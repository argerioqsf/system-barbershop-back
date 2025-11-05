import { describe, expect, it } from 'vitest'
import {
  CommissionCalculator,
  CommissionSourceInput,
} from '../../../../src/modules/finance/domain/services/commission-calculator'
import { Money } from '../../../../src/core/domain/value-objects/money'
import { Percentage } from '../../../../src/core/domain/value-objects/percentage'

function makeSource(
  overrides: Partial<CommissionSourceInput> = {},
): CommissionSourceInput {
  return {
    saleId: 'sale-1',
    saleItemId: 'item-1',
    baseAmount: Money.from(100),
    commissionPercentage: Percentage.from(30),
    alreadyPaid: Money.from(0),
    ...overrides,
  }
}

describe('CommissionCalculator', () => {
  it('calculates remaining commission for sale item', () => {
    const calculator = new CommissionCalculator()

    const result = calculator.calculate([makeSource()])

    expect(result.totalCommission.toNumber()).toBe(30)
    expect(result.items).toHaveLength(1)
    const item = result.items[0]
    expect(item.saleId).toBe('sale-1')
    expect(item.saleItemId).toBe('item-1')
    expect(item.amount.toNumber()).toBe(30)
    expect(item.commissionValue.toNumber()).toBe(30)
    expect(item.alreadyPaid.toNumber()).toBe(0)
  })

  it('ignores sources without remaining commission', () => {
    const calculator = new CommissionCalculator()

    const result = calculator.calculate([
      makeSource({
        baseAmount: Money.from(90),
        commissionPercentage: Percentage.from(20),
        alreadyPaid: Money.from(18),
      }),
      makeSource({
        saleItemId: 'item-2',
        baseAmount: Money.from(50),
        commissionPercentage: Percentage.from(10),
        alreadyPaid: Money.from(10),
      }),
    ])

    expect(result.totalCommission.toNumber()).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('handles fractional values applying rounding on each step', () => {
    const calculator = new CommissionCalculator()

    const result = calculator.calculate([
      makeSource({
        saleId: 'sale-2',
        saleItemId: 'item-2',
        baseAmount: Money.from(99.99),
        commissionPercentage: Percentage.from(33.333),
        alreadyPaid: Money.from(10.01),
      }),
      makeSource({
        saleId: 'sale-3',
        saleItemId: 'item-3',
        baseAmount: Money.from(40),
        commissionPercentage: Percentage.from(12.5),
        alreadyPaid: Money.from(0),
      }),
    ])

    expect(result.items).toHaveLength(2)
    expect(result.items[0].saleId).toBe('sale-2')
    expect(result.items[0].amount.toNumber()).toBe(23.32)
    expect(result.items[0].commissionValue.toNumber()).toBe(33.33)
    expect(result.items[0].alreadyPaid.toNumber()).toBe(10.01)
    expect(result.items[1].saleId).toBe('sale-3')
    expect(result.items[1].amount.toNumber()).toBe(5)
    expect(result.items[1].commissionValue.toNumber()).toBe(5)
    expect(result.totalCommission.toNumber()).toBe(28.32)
  })

  it('propagates meta information without modifications', () => {
    const calculator = new CommissionCalculator()
    const meta = { serviceName: 'Haircut', barberId: 'barber-1' }

    const result = calculator.calculate([
      makeSource({ meta, commissionPercentage: Percentage.from(25) }),
    ])

    expect(result.items[0].meta).toEqual(meta)
  })
})
