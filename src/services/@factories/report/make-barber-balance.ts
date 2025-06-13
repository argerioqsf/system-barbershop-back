import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { BarberBalanceService } from '@/services/report/barber-balance'

export function makeBarberBalance() {
  const transactionRepo = new PrismaTransactionRepository()
  const barberUserRepo = new PrismaBarberUsersRepository()
  const service = new BarberBalanceService(transactionRepo, barberUserRepo)
  return service
}
