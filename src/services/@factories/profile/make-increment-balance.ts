import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'

export function makeIncrementBalanceProfileService() {
  return new IncrementBalanceProfileService(
    new PrismaProfilesRepository(),
    new PrismaTransactionRepository(),
  )
}
