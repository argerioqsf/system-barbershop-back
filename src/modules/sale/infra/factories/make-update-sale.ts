import { prisma } from '@/lib/prisma'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import {
  TransactionRunner,
  UpdateSaleUseCase,
} from '@/modules/sale/application/use-cases/update-sale'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeUpdateSale() {
  const saleRepository = new PrismaSaleRepository()
  const runInTransaction: TransactionRunner = (fn) => prisma.$transaction(fn)
  const telemetry = makeSaleTelemetry()
  return new UpdateSaleUseCase(saleRepository, runInTransaction, telemetry)
}
