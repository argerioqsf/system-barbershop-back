import { PrismaLoansRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-loans-repository'
import { ListUserLoansUseCase } from '@/modules/finance/application/use-cases/list-user-loans'

export function makeListUserLoansUseCase() {
  const loansRepository = new PrismaLoansRepositoryAdapter()
  return new ListUserLoansUseCase(loansRepository)
}
