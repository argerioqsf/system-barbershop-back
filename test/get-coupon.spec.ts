import { describe, it, expect, beforeEach } from 'vitest'
import { GetCouponService } from '../src/services/coupon/get-coupon'
import { FakeCouponRepository } from './helpers/fake-repositories'
import { makeCoupon } from './helpers/default-values'
import { DiscountType } from '@prisma/client'

const coupon = makeCoupon('c1', 'C1', 10, DiscountType.VALUE)

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
