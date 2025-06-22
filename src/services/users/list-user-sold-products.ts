import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'

interface ListUserSoldProductsRequest {
  userId: string
}

interface ListUserSoldProductsResponse {
  items: DetailedSale['items']
}

export class ListUserSoldProductsService {
  constructor(private repository: SaleRepository) {}

  async execute({
    userId,
  }: ListUserSoldProductsRequest): Promise<ListUserSoldProductsResponse> {
    const sales = await this.repository.findManyByBarber(userId)
    const items = sales.flatMap((sale) =>
      sale.items.filter((i) => i.barberId === userId && i.productId),
    )
    return { items }
  }
}
