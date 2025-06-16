import { SaleRepository } from '@/repositories/sale-repository'
import { GetSaleRequest, GetSaleResponse } from './types'

export class GetSaleService {
  constructor(private repository: SaleRepository) {}

  async execute({ id }: GetSaleRequest): Promise<GetSaleResponse> {
    const sale = await this.repository.findById(id)
    return { sale }
  }
}
