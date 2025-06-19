import { UserToken } from '@/http/controllers/authenticate-controller'
import { CouponRepository } from '@/repositories/coupon-repository'
import { assertUser } from '@/utils/assert-user'
import { Coupon } from '@prisma/client'

interface ListCouponsResponse {
  coupons: Coupon[]
}

export class ListCouponsService {
  constructor(private repository: CouponRepository) {}

  async execute(userToken: UserToken): Promise<ListCouponsResponse> {
    assertUser(userToken)
    let coupons = await this.repository.findMany()

    if (userToken.role === 'OWNER') {
      coupons = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      coupons = await this.repository.findMany()
    } else {
      coupons = await this.repository.findMany({
        unitId: userToken.unitId,
      })
    }
    return { coupons }
  }
}
