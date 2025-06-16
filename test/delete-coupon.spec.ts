import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteCouponService } from '../src/services/coupon/delete-coupon'
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

describe('Delete coupon service', () => {
  let repo: FakeCouponRepository
  let service: DeleteCouponService

  beforeEach(() => {
    repo = new FakeCouponRepository([coupon])
    service = new DeleteCouponService(repo)
  })

  it('removes coupon', async () => {
    await service.execute({ id: 'c1' })
    expect(repo.coupons).toHaveLength(0)
  })
})
