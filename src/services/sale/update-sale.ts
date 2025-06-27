import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { UpdateSaleRequest } from './types'

interface UpdateSaleResponse {
  sale: DetailedSale
}

export class UpdateSaleService {
  constructor(private repository: SaleRepository) {}

  async execute({
    id,
    observation,
    method,
    paymentStatus,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const sale = await this.repository.update(id, {
      observation,
      method,
      paymentStatus,
    })
    return { sale }
  }
}
