import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { GetSaleUseCase } from '@/modules/sale/application/use-cases/get-sale'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeGetSale() {
  const saleRepository = new PrismaSaleRepository()
  const telemetry = makeSaleTelemetry()
  return new GetSaleUseCase(saleRepository, telemetry)
}
