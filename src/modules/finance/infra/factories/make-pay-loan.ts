import { PrismaLoansRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-loans-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { PayLoanUseCase } from '@/modules/finance/application/use-cases/pay-loan'

export function makePayLoanUseCase() {
  const loansRepository = new PrismaLoansRepositoryAdapter()
  const barberUsersRepository = new PrismaBarberUsersRepository()
  const unitRepository = new PrismaUnitRepository()

  const incrementBalanceProfileService = new IncrementBalanceProfileService(
    new PrismaProfilesRepository(),
  )

  const incrementBalanceUnitService = new IncrementBalanceUnitService(
    unitRepository,
  )

  return new PayLoanUseCase(
    loansRepository,
    barberUsersRepository,
    incrementBalanceProfileService,
    incrementBalanceUnitService,
  )
}
