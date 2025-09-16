import { UserToken } from '@/http/controllers/authenticate-controller'
import { CouponRepository } from '@/repositories/coupon-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { Coupon, Prisma } from '@prisma/client'

export class ListCouponsService {
  constructor(private repository: CouponRepository) {}

  async execute(
    userToken: UserToken,
    params: {
      code?: string
      page?: number
      perPage?: number
      withCount?: boolean
    } = {},
  ): Promise<{
    items: Coupon[]
    count: number
    page: number
    perPage: number
  }> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where: Prisma.CouponWhereInput = {
      ...buildUnitWhere(scope),
      ...(params.code ? { code: { contains: params.code } } : {}),
    }
    const { page, perPage, withCount } = params
    if (page && perPage) {
      const { items, count } = await this.repository.findManyPaginated(
        where,
        page,
        perPage,
      )
      return {
        items,
        count: withCount ? count : 0,
        page: withCount ? page : 0,
        perPage: withCount ? perPage : 0,
      }
    }
    const coupons = await this.repository.findMany(where)
    return {
      items: coupons,
      count: withCount ? coupons.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? coupons.length : 0,
    }
  }
}
