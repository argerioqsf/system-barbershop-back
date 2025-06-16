import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'

interface GetSaleRequest {
  id: string
}

interface GetSaleResponse {
  sale: DetailedSale | null
}

export class GetSaleService {
  constructor(private repository: SaleRepository) {}

  async execute({ id }: GetSaleRequest): Promise<GetSaleResponse> {
    const sale = await this.repository.findById(id)
    return { sale }
  }
}
