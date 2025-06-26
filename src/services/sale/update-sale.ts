import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { Prisma } from '@prisma/client'

interface UpdateSaleRequest {
  id: string
  data: Prisma.SaleUpdateInput
}

interface UpdateSaleResponse {
  sale: DetailedSale
}

export class UpdateSaleService {
  constructor(private repository: SaleRepository) {}

  async execute({ id, data }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const sale = await this.repository.update(id, data)
    return { sale }
  }
}
