import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { DeleteCouponService } from '@/services/coupon/delete-coupon'

export function makeDeleteCouponService() {
  return new DeleteCouponService(new PrismaCouponRepository())
}
