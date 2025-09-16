import { UserToken } from '@/http/controllers/authenticate-controller'
import { DetailedSale, SaleRepository } from '@/repositories/sale-repository'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
import { assertUser } from '@/utils/assert-user'
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client'

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(
    userToken: UserToken,
    params: {
      page?: number
      perPage?: number
      withCount?: boolean
      paymentStatus?: PaymentStatus
      method?: PaymentMethod
      from?: Date
      to?: Date
      clientId?: string
      userId?: string
    } = {},
  ): Promise<{
    items: DetailedSale[]
    count: number
    page: number
    perPage: number
  }> {
    assertUser(userToken)
    await assertPermission(['LIST_SALES_UNIT'], userToken.permissions)
    const scope = getScope(userToken)
    const where: Prisma.SaleWhereInput = {
      ...buildUnitWhere(scope),
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
      ...(params.method ? { method: params.method } : {}),
      ...(params.clientId ? { clientId: params.clientId } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
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
    const sales = await this.repository.findMany(where)
    return {
      items: sales,
      count: withCount ? sales.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? sales.length : 0,
    }
  }
}
