import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateCouponService } from '../src/services/coupon/update-coupon'
import { FakeCouponRepository } from './helpers/fake-repositories'
import { makeCoupon } from './helpers/default-values'
import { DiscountType } from '@prisma/client'

const coupon = makeCoupon('c1', 'C1', 10, DiscountType.VALUE)

describe('Update coupon service', () => {
  let repo: FakeCouponRepository
  let service: UpdateCouponService

  beforeEach(() => {
    repo = new FakeCouponRepository([coupon])
    service = new UpdateCouponService(repo)
  })

  it('updates coupon data', async () => {
    const res = await service.execute({ id: 'c1', data: { quantity: { decrement: 2 } } })
    expect(res.coupon.quantity).toBe(3)
  })
})
