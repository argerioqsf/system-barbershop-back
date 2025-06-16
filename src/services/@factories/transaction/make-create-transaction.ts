import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { CreateTransactionService } from '@/services/transaction/create-transaction'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'

export function makeCreateTransaction() {
  return new CreateTransactionService(
    new PrismaTransactionRepository(),
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
    new PrismaUnitRepository(),
    new PrismaOrganizationRepository(),
  )
}
