import { PrismaDebtsRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-debts-repository'
import { DeleteDebtUseCase } from '@/modules/finance/application/use-cases/delete-debt'

export function makeDeleteDebtUseCase() {
  const debtsRepository = new PrismaDebtsRepositoryAdapter()
  return new DeleteDebtUseCase(debtsRepository)
}
