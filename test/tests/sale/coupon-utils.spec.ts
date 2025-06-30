import { describe, it, expect } from 'vitest'
import { applyCouponToSale, applyCouponToItems } from '../../../src/services/sale/utils/coupon'
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

    const result = await applyCouponToSale(
      { serviceId: 's1', quantity: 1, couponCode: coupon.code },
      100,
      100,
      0,
      null,
      false,
      repo,
      'unit-1',
    )

    expect(result.price).toBe(90)
    expect(result.discount).toBe(10)
    expect(repo.coupons[0].quantity).toBe(4)
  })

  it('applies value coupon across items', async () => {
    const { repo } = setup()
    const coupon = makeCoupon('c2', 'VAL20', 20, 'VALUE')
    repo.coupons.push(coupon)

    const items = [
      { price: 100, ownDiscount: false },
      { price: 50, ownDiscount: false },
    ]

    await applyCouponToItems(items as any, coupon.code, repo, 'unit-1')

    expect(items[0].price).toBeCloseTo(100 - (100 / 150) * 20)
    expect(items[1].price).toBeCloseTo(50 - (50 / 150) * 20)
    expect(repo.coupons[0].quantity).toBe(4)
  })
})
