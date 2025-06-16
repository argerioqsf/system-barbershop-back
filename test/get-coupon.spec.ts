import { describe, it, expect, beforeEach } from 'vitest'
import { GetCouponService } from '../src/services/coupon/get-coupon'
import { FakeCouponRepository } from './helpers/fake-repositories'

const coupon = {
  id: 'c1',
  code: 'C1',
  description: null,
  discount: 10,
  discountType: 'VALUE',
  imageUrl: null,
  quantity: 5,
  unitId: 'unit-1',
  createdAt: new Date(),
} as any

describe('Get coupon service', () => {
  let repo: FakeCouponRepository
  let service: GetCouponService

  beforeEach(() => {
    repo = new FakeCouponRepository([coupon])
    service = new GetCouponService(repo)
  })

  it('returns coupon when found', async () => {
    const res = await service.execute({ id: 'c1' })
    expect(res.coupon?.id).toBe('c1')
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'other' })
    expect(res.coupon).toBeNull()
  })
})
