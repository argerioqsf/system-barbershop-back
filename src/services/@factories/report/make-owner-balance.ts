import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { OwnerBalanceService } from '@/services/report/owner-balance'

export function makeOwnerBalance() {
  const transactionRepo = new PrismaTransactionRepository()
  const userRepo = new PrismaBarberUsersRepository()
  return new OwnerBalanceService(transactionRepo, userRepo)
}
