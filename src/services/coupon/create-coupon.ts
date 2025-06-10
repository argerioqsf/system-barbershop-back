import { CouponRepository } from '@/repositories/coupon-repository'
import { Coupon } from '@prisma/client'

interface CreateCouponRequest {
  code: string
  description?: string | null
  discount: number
  imageUrl?: string | null
}

interface CreateCouponResponse {
  coupon: Coupon
}

export class CreateCouponService {
  constructor(private repository: CouponRepository) {}

  async execute(data: CreateCouponRequest): Promise<CreateCouponResponse> {
    const coupon = await this.repository.create(data)
    return { coupon }
  }
}
