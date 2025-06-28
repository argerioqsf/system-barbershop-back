import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PayBalanceTransactionService } from '@/services/transaction/pay-balance-transaction'

export function makePayBalanceTransaction() {
  return new PayBalanceTransactionService(
    new PrismaTransactionRepository(),
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
  )
}
