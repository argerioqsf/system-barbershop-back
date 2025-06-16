import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { OpenSessionService } from '@/services/cash-register/open-session'

export function makeOpenSessionService() {
  return new OpenSessionService(
    new PrismaCashRegisterRepository(),
    new PrismaTransactionRepository(),
  )
}
