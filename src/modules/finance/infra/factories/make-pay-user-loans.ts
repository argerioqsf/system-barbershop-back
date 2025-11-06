import { PrismaLoansRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-loans-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { PayUserLoansUseCase } from '@/modules/finance/application/use-cases/pay-user-loans'

export function makePayUserLoansUseCase() {
  const loansRepository = new PrismaLoansRepositoryAdapter()
  const unitRepository = new PrismaUnitRepository()
  const incrementUnitService = new IncrementBalanceUnitService(unitRepository)

  return new PayUserLoansUseCase(loansRepository, incrementUnitService)
}
