import { SaleRepository } from '../../repositories/sale-repository'
import { Sale } from '@prisma/client'

interface ListSalesResponse {
  sales: Sale[]
}

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(): Promise<ListSalesResponse> {
    const sales = await this.repository.findMany()
    return { sales }
  }
}
