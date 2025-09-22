import { prisma } from '@/lib/prisma'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { SaleItemUpdateExecutor } from '@/modules/sale/application/services/sale-item-update-executor'
import { SaleTotalsService } from '@/modules/sale/application/services/sale-totals-service'

export function makeSaleItemUpdateExecutor() {
  const saleItemRepository = new PrismaSaleItemRepository()
  const saleRepository = new PrismaSaleRepository()
  const couponRepository = new PrismaCouponRepository()
  const saleTotalsService = new SaleTotalsService(
    saleRepository,
    couponRepository,
  )

  const executor = new SaleItemUpdateExecutor({
    saleItemRepository,
    saleRepository,
    saleTotalsService,
    runInTransaction: (fn) => prisma.$transaction(fn),
  })

  return {
    executor,
    saleItemRepository,
    saleRepository,
    couponRepository,
    saleTotalsService,
  }
}
