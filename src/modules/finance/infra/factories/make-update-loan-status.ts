import { PrismaLoansRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-loans-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { UpdateLoanStatusUseCase } from '@/modules/finance/application/use-cases/update-loan-status'

export function makeUpdateLoanStatusUseCase() {
  const loansRepository = new PrismaLoansRepositoryAdapter()
  const unitRepository = new PrismaUnitRepository()
  const incrementUnitBalance = new IncrementBalanceUnitService(unitRepository)

  return new UpdateLoanStatusUseCase(loansRepository, incrementUnitBalance)
}
