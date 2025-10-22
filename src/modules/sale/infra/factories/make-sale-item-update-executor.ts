import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaCouponRepository } from '@/modules/sale/infra/repositories/prisma/prisma-coupon-repository'
import { PrismaSaleItemRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-item-repository'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
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
    transactionRunner: defaultTransactionRunner,
  })

  return {
    executor,
    saleItemRepository,
    saleRepository,
    couponRepository,
    saleTotalsService,
  }
}
