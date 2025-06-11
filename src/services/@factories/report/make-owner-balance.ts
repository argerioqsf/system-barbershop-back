import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { OwnerBalanceService } from '@/services/report/owner-balance'

export function makeOwnerBalance() {
  const saleRepo = new PrismaSaleRepository()
  const transactionRepo = new PrismaTransactionRepository()
  const userRepo = new PrismaBarberUsersRepository()
  return new OwnerBalanceService(saleRepo, transactionRepo, userRepo)
}
