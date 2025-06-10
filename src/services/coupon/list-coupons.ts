import { CouponRepository } from '@/repositories/coupon-repository'
import { Coupon } from '@prisma/client'

interface ListCouponsResponse {
  coupons: Coupon[]
}

export class ListCouponsService {
  constructor(private repository: CouponRepository) {}

  async execute(): Promise<ListCouponsResponse> {
    const coupons = await this.repository.findMany()
    return { coupons }
  }
}
