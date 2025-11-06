import { ListCashSessionsUseCase } from '@/modules/finance/application/use-cases/list-cash-sessions'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionsRepository } from '@/modules/finance/infra/repositories/prisma/prisma-transactions-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'

export function makeListCashSessionsUseCase() {
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const transactionsRepository = new PrismaTransactionsRepository()
  const saleRepository = new PrismaSaleRepository()

  return new ListCashSessionsUseCase(
    cashRegisterRepository,
    transactionsRepository,
    saleRepository,
  )
}
