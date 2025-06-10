import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { GetCouponService } from '@/services/coupon/get-coupon'

export function makeGetCouponService() {
  return new GetCouponService(new PrismaCouponRepository())
}
