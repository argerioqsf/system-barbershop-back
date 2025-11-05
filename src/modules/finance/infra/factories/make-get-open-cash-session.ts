import { GetOpenCashSessionUseCase } from '@/modules/finance/application/use-cases/get-open-cash-session'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionsRepository } from '@/modules/finance/infra/repositories/prisma/prisma-transactions-repository'

export function makeGetOpenCashSessionUseCase() {
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const transactionsRepository = new PrismaTransactionsRepository()

  return new GetOpenCashSessionUseCase(
    cashRegisterRepository,
    transactionsRepository,
  )
}
