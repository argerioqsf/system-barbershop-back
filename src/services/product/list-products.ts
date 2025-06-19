import { UserToken } from '@/http/controllers/authenticate-controller'
import { ProductRepository } from '@/repositories/product-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { Product } from '@prisma/client'

interface ListProductsResponse {
  products: Product[]
}

export class ListProductsService {
  constructor(private repository: ProductRepository) {}

  async execute(user: UserToken): Promise<ListProductsResponse> {
    assertUser(user)
    const scope = getScope(user)
    const where = buildUnitWhere(scope)
    const products = await this.repository.findMany(where)
    return { products }
  }
}
