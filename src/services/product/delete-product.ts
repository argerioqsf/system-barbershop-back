import { ProductRepository } from '@/repositories/product-repository'

interface DeleteProductRequest {
  id: string
}

export class DeleteProductService {
  constructor(private repository: ProductRepository) {}

  async execute({ id }: DeleteProductRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
