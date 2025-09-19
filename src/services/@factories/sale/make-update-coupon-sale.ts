import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { UpdateCouponSaleService } from '@/services/sale/update-coupon-sale'

export function makeUpdateCouponSale() {
  const repository = new PrismaSaleRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  return new UpdateCouponSaleService(
    repository,
    couponRepository,
    barberUserRepository,
    saleItemRepository,
  )
}
