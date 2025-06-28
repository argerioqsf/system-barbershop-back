import { PrismaLoanRequestRepository } from '@/repositories/prisma/prisma-loan-request-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { WithdrawalBalanceTransactionService } from '@/services/transaction/withdrawal-balance-transaction'
import { PayUserService } from '@/services/loan/pay-user'

export function makePayUser() {
  const withdrawal = new WithdrawalBalanceTransactionService(
    new PrismaTransactionRepository(),
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
    new PrismaUnitRepository(),
    new PrismaOrganizationRepository(),
  )
  return new PayUserService(withdrawal, new PrismaLoanRequestRepository())
}
