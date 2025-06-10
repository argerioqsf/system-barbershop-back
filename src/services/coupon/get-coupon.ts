import { CouponRepository } from '@/repositories/coupon-repository'
import { Coupon } from '@prisma/client'

interface GetCouponRequest {
  id: string
}

interface GetCouponResponse {
  coupon: Coupon | null
}

export class GetCouponService {
  constructor(private repository: CouponRepository) {}

  async execute({ id }: GetCouponRequest): Promise<GetCouponResponse> {
    const coupon = await this.repository.findById(id)
    return { coupon }
  }
}
