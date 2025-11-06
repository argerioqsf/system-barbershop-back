import { ListPendingCommissionsUseCase } from '@/modules/finance/application/use-cases/list-pending-commissions'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'

export function makeListUserPendingCommissions() {
  const saleItemRepository = new PrismaSaleItemRepository()
  const loanRepository = new PrismaLoanRepository()

  return new ListPendingCommissionsUseCase(saleItemRepository, loanRepository)
}
