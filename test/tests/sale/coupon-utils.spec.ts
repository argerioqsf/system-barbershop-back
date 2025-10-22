import { describe, it, expect } from 'vitest'
import {
  applyCouponSaleItem,
  applyCouponSale,
} from '../../../src/services/sale/utils/coupon'
import { FakeCouponRepository } from '../../helpers/fake-repositories'
import { makeCoupon, makeSaleItem } from '../../helpers/default-values'
import { calculateRealValueSaleItem } from '../../../src/services/sale/utils/item'

function setup() {
  const repo = new FakeCouponRepository()
  return { repo }
}

describe('coupon utilities', () => {
  it('applies coupon to single item', async () => {
    const { repo } = setup()
    const coupon = makeCoupon('c1', 'OFF10', 10, 'VALUE')
    repo.coupons.push(coupon)
    const saleItem = makeSaleItem({
      id: 'item-1',
      serviceId: 's1',
      quantity: 1,
      price: 100,
      saleId: 'sale-1',
      couponId: coupon.id,
    })

    const result = await applyCouponSaleItem({
      saleItem,
      basePrice: 100,
      couponRepository: repo,
    })
    const realPriceItem = calculateRealValueSaleItem(
      result.price,
      result.discounts,
    )

    expect(realPriceItem).toBe(90)
    expect(result.price).toBe(100)
    expect(result.discount).toBe(10)
  })

  it('applies value coupon across items', async () => {
    const { repo } = setup()
    const coupon = makeCoupon('c2', 'VAL20', 20, 'VALUE')
    repo.coupons.push(coupon)

    const items = [
      {
        id: 'item-1',
        saleId: 'sale-1',
        price: 100,
        basePrice: 100,
        quantity: 1,
        ownDiscount: false,
        discounts: [],
        commissionPaid: false,
      },
      {
        id: 'item-2',
        saleId: 'sale-1',
        price: 50,
        basePrice: 50,
        quantity: 1,
        ownDiscount: false,
        discounts: [],
        commissionPaid: false,
      },
    ]

    await applyCouponSale(items as any, coupon.id, repo, 'unit-1')
    const realPrice0 = calculateRealValueSaleItem(
      items[0].price,
      items[0].discounts,
    )
    const realPrice1 = calculateRealValueSaleItem(
      items[1].price,
      items[1].discounts,
    )
    expect(realPrice0).toBeCloseTo(100 - (100 / 150) * 20)
    expect(realPrice1).toBeCloseTo(50 - (50 / 150) * 20)
  })

  it('applies custom price discount', async () => {
    const { repo } = setup()
    const saleItem = makeSaleItem({
      id: 'item-1',
      serviceId: 's1',
      quantity: 1,
      price: 100,
      saleId: 'sale-1',
      customPrice: 80,
    })
    const result = await applyCouponSaleItem({
      saleItem,
      basePrice: 100,
      couponRepository: repo,
    })
    const realPriceItem = calculateRealValueSaleItem(
      result.price,
      result.discounts,
    )

    expect(result.price).toBe(100)
    expect(realPriceItem).toBe(80)
    expect(result.discount).toBe(20)
    expect(result.discountType).toBe('VALUE')
  })

  it('throws when custom price greater than base price', async () => {
    const { repo } = setup()
    const saleItem = makeSaleItem({
      id: 'item-1',
      serviceId: 's1',
      quantity: 1,
      price: 100,
      saleId: 'sale-1',
      customPrice: 120,
    })
    await expect(
      applyCouponSaleItem({
        saleItem,
        basePrice: 100,
        couponRepository: repo,
      }),
    ).rejects.toThrow('Item price greater than service price')
  })
})
