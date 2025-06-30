import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { ListUserPendingCommissionsService } from '@/services/users/list-user-pending-commissions'

export function makeListUserPendingCommissions() {
  const saleItemRepository = new PrismaSaleItemRepository()
  return new ListUserPendingCommissionsService(saleItemRepository)
}
