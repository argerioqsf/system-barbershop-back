import { PrismaDebtsRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-debts-repository'
import { UpdateDebtUseCase } from '@/modules/finance/application/use-cases/update-debt'

export function makeUpdateDebtUseCase() {
  const debtsRepository = new PrismaDebtsRepositoryAdapter()
  return new UpdateDebtUseCase(debtsRepository)
}
