import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { RecalculateUserSalesService } from '@/services/sale/recalculate-user-sales'

export function makeRecalculateUserSalesService() {
  const saleRepository = new PrismaSaleRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const couponRepository = new PrismaCouponRepository()

  return new RecalculateUserSalesService(
    saleRepository,
    saleItemRepository,
    planRepository,
    planProfileRepository,
    couponRepository,
  )
}
