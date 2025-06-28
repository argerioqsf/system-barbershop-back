import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { ListUserPendingCommissionsService } from '@/services/users/list-user-pending-commissions'

export function makeListUserPendingCommissions() {
  const repository = new PrismaSaleRepository()
  return new ListUserPendingCommissionsService(repository)
}
