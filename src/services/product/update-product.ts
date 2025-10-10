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

  // TODO: verificar qual o impacto da atualizacao de quantidade de um produto
  // em uma sale que ainda nao foi finalizada
  // ex: se uma sale em andamento tiver um produto vinculado, e esse produto tiver a sua quantidade alterada
  // fazendo com que ele nao tenha mais estoque para essa venda, como tratar esse erro?
  async execute({
    id,
    data,
  }: UpdateProductRequest): Promise<UpdateProductResponse> {
    const product = await this.repository.update(id, data)
    return { product }
  }
}
