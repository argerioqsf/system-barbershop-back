import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { UpdateSaleUseCase } from '@/modules/sale/application/use-cases/update-sale'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeUpdateSale() {
  const saleRepository = new PrismaSaleRepository()
  const telemetry = makeSaleTelemetry()
  return new UpdateSaleUseCase(
    saleRepository,
    defaultTransactionRunner,
    telemetry,
  )
}
