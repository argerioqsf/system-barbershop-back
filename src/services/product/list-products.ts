import { UserToken } from '@/http/controllers/authenticate-controller'
import { ProductRepository } from '@/repositories/product-repository'
import { assertUser } from '@/utils/assert-user'
import { Product } from '@prisma/client'

export interface ListProductsFilters {
  name?: string
  page?: number
  perPage?: number
  withCount?: boolean
}

export interface ListProductsResponse {
  items: Product[]
  count: number
  page: number
  perPage: number
}

export class ListProductsService {
  constructor(private repository: ProductRepository) {}

  async execute(
    user: UserToken,
    { name, page, perPage, withCount }: ListProductsFilters = {},
  ): Promise<ListProductsResponse> {
    assertUser(user)
    const where = {
      ...{ unitId: user.unitId },
      ...(name ? { name: { contains: name } } : {}),
    }

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

    const products = await this.repository.findMany(where)
    return {
      items: products,
      count: withCount ? products.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? products.length : 0,
    }
  }
}
