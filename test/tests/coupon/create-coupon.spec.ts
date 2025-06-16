import { describe, it, expect, beforeEach } from 'vitest'
import { CreateCouponService } from '../../../src/services/coupon/create-coupon'
import { FakeCouponRepository } from '../../helpers/fake-repositories'

describe('Create coupon service', () => {
  let repo: FakeCouponRepository
  let service: CreateCouponService

  beforeEach(() => {
    repo = new FakeCouponRepository([])
    service = new CreateCouponService(repo)
  })

  it('creates coupon', async () => {
    const res = await service.execute({
      code: 'CP10',
      description: null,
      discount: 10,
      discountType: 'VALUE',
      imageUrl: null,
      quantity: 5,
      unitId: 'unit-1',
    })
    expect(res.coupon.code).toBe('CP10')
    expect(repo.coupons).toHaveLength(1)
  })
})
