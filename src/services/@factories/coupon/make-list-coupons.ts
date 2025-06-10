import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { ListCouponsService } from '@/services/coupon/list-coupons'

export function makeListCouponsService() {
  return new ListCouponsService(new PrismaCouponRepository())
}
