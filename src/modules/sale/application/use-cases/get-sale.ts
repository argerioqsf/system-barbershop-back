import { SaleRepository } from '@/repositories/sale-repository'
import { GetSaleRequest, GetSaleResponse } from '@/services/sale/types'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'
import { ValidateSaleError } from '../../domain/errors/validate-sale-erros'

export class GetSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute({ id, actor }: GetSaleRequest): Promise<GetSaleResponse> {
    const sale = await this.saleRepository.findById(id)
    if (actor.role !== 'ADMIN' && actor.unitId !== sale?.unitId) {
      throw new ValidateSaleError('Sale not found')
    }
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
