import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { WithdrawalBalanceTransactionService } from '@/services/transaction/withdrawal-balance-transaction'

export function makeWithdrawalBalanceTransaction() {
  return new WithdrawalBalanceTransactionService(
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
    new PrismaUnitRepository(),
  )
}
