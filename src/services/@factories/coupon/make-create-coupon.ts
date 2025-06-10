import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { CreateCouponService } from '@/services/coupon/create-coupon'

export function makeCreateCouponService() {
  return new CreateCouponService(new PrismaCouponRepository())
}
