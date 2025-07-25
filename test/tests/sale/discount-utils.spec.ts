import { describe, it, expect } from 'vitest'
import { computeDiscountInfo } from '../../../src/services/sale/utils/discount'
import { DiscountType } from '@prisma/client'

describe('computeDiscountInfo', () => {
  it('returns zero when no discounts', () => {
    const result = computeDiscountInfo(100)
    expect(result).toEqual({ discount: 0, discountType: null })
  })

  it('returns single discount info', () => {
    const result = computeDiscountInfo(90, [
      { amount: 10, type: DiscountType.VALUE, order: 1 },
    ])
    expect(result).toEqual({ discount: 10, discountType: DiscountType.VALUE })
  })

  it('reconstructs discount from multiple entries', () => {
    const result = computeDiscountInfo(85, [
      { amount: 5, type: DiscountType.VALUE, order: 1 },
      { amount: 10, type: DiscountType.PERCENTAGE, order: 2 },
    ])
    expect(result.discount).toBeCloseTo(14.44, 2)
    expect(result.discountType).toBe(DiscountType.VALUE)
  })
})
