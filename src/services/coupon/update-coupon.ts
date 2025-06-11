import { CouponRepository } from '@/repositories/coupon-repository'
import { Coupon, Prisma } from '@prisma/client'

interface UpdateCouponRequest {
  id: string
  data: Prisma.CouponUpdateInput
}

interface UpdateCouponResponse {
  coupon: Coupon
}

export class UpdateCouponService {
  constructor(private repository: CouponRepository) {}

  async execute({
    id,
    data,
  }: UpdateCouponRequest): Promise<UpdateCouponResponse> {
    const coupon = await this.repository.update(id, data)
    return { coupon }
  }
}
