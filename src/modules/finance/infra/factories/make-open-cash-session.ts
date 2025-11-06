import { OpenCashSessionUseCase } from '@/modules/finance/application/use-cases/open-cash-session'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'

export function makeOpenCashSessionUseCase() {
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const profilesRepository = new PrismaProfilesRepository()
  const incrementBalanceUnitService = new IncrementBalanceUnitService(
    new PrismaUnitRepository(),
  )

  return new OpenCashSessionUseCase(
    cashRegisterRepository,
    profilesRepository,
    incrementBalanceUnitService,
  )
}
