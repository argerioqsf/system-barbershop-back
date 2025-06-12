import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { BarberBalanceService } from '@/services/report/barber-balance'

export function makeBarberBalance() {
  const transactionRepo = new PrismaTransactionRepository()
  const service = new BarberBalanceService(transactionRepo)
  return service
}
