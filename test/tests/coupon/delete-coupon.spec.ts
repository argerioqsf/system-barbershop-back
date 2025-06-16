import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteCouponService } from '../../../src/services/coupon/delete-coupon'
import { FakeCouponRepository } from '../../helpers/fake-repositories'
import { makeCoupon } from '../../helpers/default-values'
import { DiscountType } from '@prisma/client'

const coupon = makeCoupon('c1', 'C1', 10, DiscountType.VALUE)

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
