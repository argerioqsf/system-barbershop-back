import { PrismaDebtsRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-debts-repository'
import { GetDebtUseCase } from '@/modules/finance/application/use-cases/get-debt'

export function makeGetDebtUseCase() {
  const debtsRepository = new PrismaDebtsRepositoryAdapter()
  return new GetDebtUseCase(debtsRepository)
}
