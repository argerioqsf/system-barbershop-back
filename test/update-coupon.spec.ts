import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateCouponService } from '../src/services/coupon/update-coupon'
import { FakeCouponRepository } from './helpers/fake-repositories'

const coupon = { id: 'c1', code: 'C1', description: null, discount: 10, discountType: 'VALUE', imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() } as any

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
