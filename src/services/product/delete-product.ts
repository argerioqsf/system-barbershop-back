import { ProductRepository } from '@/repositories/product-repository'

interface DeleteProductRequest {
  id: string
}

export class DeleteProductService {
  constructor(private repository: ProductRepository) {}
  // TODO: verificar qual o inpacto de deletar um produto nos outros fluxos do sistema
  async execute({ id }: DeleteProductRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
