import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { ListUserPendingCommissionsService } from '@/services/users/list-user-pending-commissions'

export function makeListUserPendingCommissions() {
  const saleItemRepository = new PrismaSaleItemRepository()
  const loanRepository = new PrismaLoanRepository()

  return new ListUserPendingCommissionsService(
    saleItemRepository,
    loanRepository,
  )
}
