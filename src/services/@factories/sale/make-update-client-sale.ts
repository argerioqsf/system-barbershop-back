import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { UpdateClientSaleService } from '@/services/sale/update-client-sale'

export function makeUpdateClientSale() {
  const repository = new PrismaSaleRepository()
  const profileRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  return new UpdateClientSaleService(
    repository,
    profileRepository,
    saleItemRepository,
    planRepository,
    planProfileRepository,
  )
}
