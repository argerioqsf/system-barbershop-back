import { CloseCashSessionUseCase } from '@/modules/finance/application/use-cases/close-cash-session'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'

export function makeCloseCashSessionUseCase() {
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const saleRepository = new PrismaSaleRepository()

  return new CloseCashSessionUseCase(cashRegisterRepository, saleRepository)
}
