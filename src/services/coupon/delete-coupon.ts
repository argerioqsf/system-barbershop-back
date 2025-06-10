import { CouponRepository } from '@/repositories/coupon-repository'

interface DeleteCouponRequest {
  id: string
}

export class DeleteCouponService {
  constructor(private repository: CouponRepository) {}

  async execute({ id }: DeleteCouponRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
