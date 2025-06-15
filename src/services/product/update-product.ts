import { ProductRepository } from '@/repositories/product-repository'
import { Product, Prisma } from '@prisma/client'

interface UpdateProductRequest {
  id: string
  data: Prisma.ProductUpdateInput
}

interface UpdateProductResponse {
  product: Product
}

export class UpdateProductService {
  constructor(private repository: ProductRepository) {}

  async execute({ id, data }: UpdateProductRequest): Promise<UpdateProductResponse> {
    const product = await this.repository.update(id, data)
    return { product }
  }
}
