import { SaleRepository } from '@/repositories/sale-repository'
import { Sale } from '@prisma/client'

interface ListSalesResponse {
  sales: Sale[]
}

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(unitId: string): Promise<ListSalesResponse> {
    const sales = await this.repository.findMany({ unitId })
    return { sales }
  }
}
