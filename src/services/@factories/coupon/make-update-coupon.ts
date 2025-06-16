import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { UpdateCouponService } from '@/services/coupon/update-coupon'

export function makeUpdateCouponService() {
  return new UpdateCouponService(new PrismaCouponRepository())
}
