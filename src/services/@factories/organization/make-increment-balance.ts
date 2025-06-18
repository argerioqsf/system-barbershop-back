import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { IncrementBalanceOrganizationService } from '@/services/organization/increment-balance'

export function makeIncrementBalanceOrganizationService() {
  return new IncrementBalanceOrganizationService(
    new PrismaOrganizationRepository(),
    new PrismaTransactionRepository(),
  )
}
