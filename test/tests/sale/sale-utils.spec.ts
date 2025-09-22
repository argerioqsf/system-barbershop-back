import { describe, it, expect } from 'vitest'
import {
  mapToSaleItems,
  calculateTotal,
  updateProductsStock,
  updateCouponsStock,
} from '../../../src/services/sale/utils/sale'
import {
  FakeProductRepository,
  FakeCouponRepository,
} from '../../helpers/fake-repositories'
import { makeProduct, makeCoupon } from '../../helpers/default-values'

describe('sale utilities', () => {
  it('maps temp items to sale items', () => {
    const result = mapToSaleItems([
      {
        basePrice: 100,
        price: 90,
        discount: 10,
        discountType: 'VALUE',
        ownDiscount: true,
        discounts: [],
        data: {
          quantity: 1,
          service: { connect: { id: 's1' } },
          barber: { connect: { id: 'b1' } },
          coupon: { connect: { id: 'c1' } },
        },
      },
    ] as any)

    expect(result[0]).toEqual(
      expect.objectContaining({
        price: 90,
        commissionPaid: false,
      }),
    )
    // discount fields are no longer returned
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result[0] as any).discount).toBeUndefined()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result[0] as any).discountType).toBeUndefined()
  })

  it('calculates total', () => {
    const total = calculateTotal([
      { basePrice: 40 } as any,
      { basePrice: 60 } as any,
    ])
    expect(total).toBe(100)
  })

  it('updates product stock', async () => {
    const repo = new FakeProductRepository([makeProduct('p1', 10, 5)])
    await updateProductsStock(repo, [{ id: 'p1', quantity: 2 }], 'decrement')
    expect(repo.products[0].quantity).toBe(3)
    await updateProductsStock(repo, [{ id: 'p1', quantity: 1 }], 'increment')
    expect(repo.products[0].quantity).toBe(4)
  })

  it('updates coupon stock', async () => {
    const repo = new FakeCouponRepository([
      makeCoupon('c1', 'OFF', 10, 'VALUE'),
    ])
    await updateCouponsStock(repo, [{ couponId: 'c1', price: 100 } as any])
    expect(repo.coupons[0].quantity).toBe(4)
  })
})
