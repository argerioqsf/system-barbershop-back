import { describe, it, expect } from 'vitest'
import {
  applyCouponSaleItem,
  applyCouponSale,
} from '../../../src/services/sale/utils/coupon'
import { FakeCouponRepository } from '../../helpers/fake-repositories'
import { makeCoupon } from '../../helpers/default-values'

function setup() {
  const repo = new FakeCouponRepository()
  return { repo }
}

describe('coupon utilities', () => {
  it('applies coupon to single item', async () => {
    const { repo } = setup()
    const coupon = makeCoupon('c1', 'OFF10', 10, 'VALUE')
    repo.coupons.push(coupon)

    const result = await applyCouponSaleItem({
      saleItem: { serviceId: 's1', quantity: 1, couponId: coupon.id },
      basePrice: 100,
      discount: 0,
      discountType: null,
      ownDiscount: false,
      couponRepository: repo,
      userUnitId: 'unit-1',
    })

    expect(result.price).toBe(90)
    expect(result.discount).toBe(10)
  })

  it('applies value coupon across items', async () => {
    const { repo } = setup()
    const coupon = makeCoupon('c2', 'VAL20', 20, 'VALUE')
    repo.coupons.push(coupon)

    const items = [
      { price: 100, ownDiscount: false, discounts: [] },
      { price: 50, ownDiscount: false, discounts: [] },
    ]

    await applyCouponSale(items as any, coupon.id, repo, 'unit-1')

    expect(items[0].price).toBeCloseTo(100 - (100 / 150) * 20)
    expect(items[1].price).toBeCloseTo(50 - (50 / 150) * 20)
  })

  it('applies custom price discount', async () => {
    const { repo } = setup()
    const result = await applyCouponSaleItem({
      saleItem: { serviceId: 's1', quantity: 1, customPrice: 80 },
      basePrice: 100,
      discount: 0,
      discountType: null,
      ownDiscount: false,
      couponRepository: repo,
    })

    expect(result.price).toBe(80)
    expect(result.discount).toBe(20)
    expect(result.discountType).toBe('VALUE')
  })

  it('throws when custom price greater than base price', async () => {
    const { repo } = setup()
    await expect(
      applyCouponSaleItem({
        saleItem: { serviceId: 's1', quantity: 1, customPrice: 120 },
        basePrice: 100,
        discount: 0,
        discountType: null,
        ownDiscount: false,
        couponRepository: repo,
      }),
    ).rejects.toThrow('Item price greater than service price')
  })
})
