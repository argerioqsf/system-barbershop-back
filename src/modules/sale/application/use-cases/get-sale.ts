import { SaleRepository } from '@/repositories/sale-repository'
import { GetSaleRequest, GetSaleResponse } from '@/services/sale/types'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export class GetSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute({ id }: GetSaleRequest): Promise<GetSaleResponse> {
    const sale = await this.saleRepository.findById(id)
    await this.telemetry?.record({
      operation: 'sale.viewed',
      saleId: id,
      metadata: {
        found: Boolean(sale),
      },
    })
    return { sale }
  }
}
