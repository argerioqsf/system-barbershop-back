import { UserToken } from '@/http/controllers/authenticate-controller'
import { CouponRepository } from '@/repositories/coupon-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { Coupon } from '@prisma/client'

interface ListCouponsResponse {
  coupons: Coupon[]
}

export class ListCouponsService {
  constructor(private repository: CouponRepository) {}

  async execute(userToken: UserToken): Promise<ListCouponsResponse> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const coupons = await this.repository.findMany(where)
    return { coupons }
  }
}
