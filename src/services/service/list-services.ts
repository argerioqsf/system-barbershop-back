import { UserToken } from '@/http/controllers/authenticate-controller'
import { ServiceRepository } from '@/repositories/service-repository'
import { assertUser } from '@/utils/assert-user'
import { Prisma, Service } from '@prisma/client'

export class ListServicesService {
  constructor(private repository: ServiceRepository) {}

  async execute(
    userToken: UserToken,
    params: {
      name?: string
      categoryId?: string
      page?: number
      perPage?: number
      withCount?: boolean
    } = {},
  ): Promise<{
    items: Service[]
    count: number
    page: number
    perPage: number
  }> {
    assertUser(userToken)
    const where: Prisma.ServiceWhereInput = {
      ...{ unitId: userToken.unitId },
      ...(params.name ? { name: { contains: params.name } } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
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
    const services = await this.repository.findMany(where)
    return {
      items: services,
      count: withCount ? services.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? services.length : 0,
    }
  }
}
