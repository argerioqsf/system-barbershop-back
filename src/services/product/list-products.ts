import { UserToken } from '@/http/controllers/authenticate-controller'
import { ProductRepository } from '@/repositories/product-repository'
import { assertUser } from '@/utils/assert-user'
import { Product } from '@prisma/client'

interface ListProductsResponse {
  products: Product[]
}

export class ListProductsService {
  constructor(private repository: ProductRepository) {}

  async execute(user: UserToken): Promise<ListProductsResponse> {
    assertUser(user)
    let products: Product[] = []
    if (user.role === 'OWNER') {
      products = await this.repository.findMany({
        unit: { organizationId: user.organizationId },
      })
    } else if (user.role === 'ADMIN') {
      products = await this.repository.findMany()
    } else {
      products = await this.repository.findMany({ unitId: user.unitId })
    }
    return { products }
  }
}
