import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { OpenSessionService } from '@/services/cash-register/open-session'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'

export function makeOpenSessionService() {
  return new OpenSessionService(
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
    new IncrementBalanceUnitService(new PrismaUnitRepository()),
  )
}
