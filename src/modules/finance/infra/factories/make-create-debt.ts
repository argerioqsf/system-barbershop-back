import { PrismaDebtsRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-debts-repository'
import { CreateDebtUseCase } from '@/modules/finance/application/use-cases/create-debt'

export function makeCreateDebtUseCase() {
  const debtsRepository = new PrismaDebtsRepositoryAdapter()
  return new CreateDebtUseCase(debtsRepository)
}
