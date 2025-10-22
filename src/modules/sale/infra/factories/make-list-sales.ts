import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { ListSalesUseCase } from '@/modules/sale/application/use-cases/list-sales'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeListSales() {
  const saleRepository = new PrismaSaleRepository()
  const telemetry = makeSaleTelemetry()
  return new ListSalesUseCase(saleRepository, telemetry)
}
