import { SaleItemCoordinator } from '@/modules/sale/application/coordinators/sale-item-coordinator'
import { UpdateSaleItemCouponUseCase } from '@/modules/sale/application/use-cases/update-sale-item-coupon'
import { UpdateSaleItemBarberUseCase } from '@/modules/sale/application/use-cases/update-sale-item-barber'
import { UpdateSaleItemQuantityUseCase } from '@/modules/sale/application/use-cases/update-sale-item-quantity'
import { UpdateSaleItemCustomPriceUseCase } from '@/modules/sale/application/use-cases/update-sale-item-custom-price'
import { UpdateSaleItemDetailsUseCase } from '@/modules/sale/application/use-cases/update-sale-item-details'
import { makeSaleItemUpdateExecutor } from './make-sale-item-update-executor'
import { PrismaProductRepository } from '@/modules/sale/infra/repositories/prisma/prisma-product-repository'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeSaleItemCoordinator() {
  const { executor, couponRepository } = makeSaleItemUpdateExecutor()
  const telemetry = makeSaleTelemetry()

  const updateCouponUseCase = new UpdateSaleItemCouponUseCase(
    executor,
    couponRepository,
    telemetry,
  )

  const updateBarberUseCase = new UpdateSaleItemBarberUseCase(
    executor,
    telemetry,
  )

  const productRepository = new PrismaProductRepository()
  const updateQuantityUseCase = new UpdateSaleItemQuantityUseCase(
    executor,
    productRepository,
    telemetry,
  )

  const updateCustomPriceUseCase = new UpdateSaleItemCustomPriceUseCase(
    executor,
    telemetry,
  )

  const updateDetailsUseCase = new UpdateSaleItemDetailsUseCase(
    executor,
    productRepository,
    telemetry,
  )

  return new SaleItemCoordinator(
    updateCouponUseCase,
    updateBarberUseCase,
    updateQuantityUseCase,
    updateCustomPriceUseCase,
    updateDetailsUseCase,
  )
}
