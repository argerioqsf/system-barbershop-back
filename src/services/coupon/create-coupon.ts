import { CouponRepository } from '@/repositories/coupon-repository'
import { Coupon } from '@prisma/client'

interface CreateCouponRequest {
  code: string
  description?: string | null
  discount: number
  discountType: 'PERCENTAGE' | 'VALUE'
  imageUrl?: string | null
  quantity?: number
  unitId: string
}

interface CreateCouponResponse {
  coupon: Coupon
}

export class CreateCouponService {
  constructor(private repository: CouponRepository) {}

  async execute(data: CreateCouponRequest): Promise<CreateCouponResponse> {
    const coupon = await this.repository.create({
      code: data.code,
      description: data.description,
      discount: data.discount,
      discountType: data.discountType,
      imageUrl: data.imageUrl,
      quantity: data.quantity,
      unit: { connect: { id: data.unitId } },
    })
    return { coupon }
  }
}
