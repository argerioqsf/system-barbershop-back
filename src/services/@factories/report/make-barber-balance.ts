import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { BarberBalanceService } from '@/services/report/barber-balance'

export function makeBarberBalance() {
  const saleRepo = new PrismaSaleRepository()
  const transactionRepo = new PrismaTransactionRepository()
  const service = new BarberBalanceService(saleRepo, transactionRepo)
  return service
}
