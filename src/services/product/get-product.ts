import { ProductRepository } from '@/repositories/product-repository'
import { Product } from '@prisma/client'

interface GetProductRequest {
  id: string
}

interface GetProductResponse {
  product: Product | null
}

export class GetProductService {
  constructor(private repository: ProductRepository) {}

  async execute({ id }: GetProductRequest): Promise<GetProductResponse> {
    const product = await this.repository.findById(id)
    return { product }
  }
}
