import { AddBalanceUseCase } from '@/modules/finance/application/use-cases/add-balance'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { UpdateCashFinalAmountUseCase } from '@/modules/finance/application/use-cases/update-cash-final-amount'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'

export function makeAddBalanceUseCase() {
  const barberUsersRepository = new PrismaBarberUsersRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const profilesRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()

  const incrementProfileService = new IncrementBalanceProfileService(
    profilesRepository,
  )
  const incrementUnitService = new IncrementBalanceUnitService(unitRepository)
  const updateCashRegisterFinalAmountUseCase = new UpdateCashFinalAmountUseCase(
    cashRegisterRepository,
  )

  return new AddBalanceUseCase(
    barberUsersRepository,
    cashRegisterRepository,
    incrementProfileService,
    incrementUnitService,
    updateCashRegisterFinalAmountUseCase,
    defaultTransactionRunner,
  )
}
