import { SaleRepository } from '@/repositories/sale-repository'
import { Sale } from '@prisma/client'

interface GetSaleRequest {
  id: string
}

interface GetSaleResponse {
  sale: Sale | null
}

export class GetSaleService {
  constructor(private repository: SaleRepository) {}

  async execute({ id }: GetSaleRequest): Promise<GetSaleResponse> {
    const sale = await this.repository.findById(id)
    return { sale }
  }
}
