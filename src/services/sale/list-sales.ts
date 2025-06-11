import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'

interface ListSalesResponse {
  sales: DetailedSale[]
}

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(): Promise<ListSalesResponse> {
    const sales = await this.repository.findMany()
    return { sales }
  }
}
