import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { OpenSessionService } from '@/services/cash-register/open-session'

export function makeOpenSessionService() {
  return new OpenSessionService(
    new PrismaCashRegisterRepository(),
    new PrismaTransactionRepository(),
    new PrismaProfilesRepository(),
  )
}
