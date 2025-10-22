import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Prisma } from '@prisma/client'
import { PlanRepository } from '@/repositories/plan-repository'
import {
  CreateSaleItem,
  SaleItemUpdateFields,
} from '@/modules/sale/application/dto/sale'
import {
  NewDiscount,
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/modules/sale/application/dto/sale-item-dto'
import { SaleItemDataBuilder } from '@/modules/sale/application/services/sale-item-data-builder'
import { DiscountSyncService } from '@/modules/sale/application/services/discount-sync-service'
import { StockService } from '@/modules/sale/application/services/stock-service'
import { ItemNeedsServiceOrProductOrAppointmentError } from '../../@errors/sale/item-needs-service-or-product-error'
import { logger } from '@/lib/logger'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleRepository } from '@/repositories/sale-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'

export function ensureSingleType(item: {
  serviceId?: string | null
  productId?: string | null
  appointmentId?: string | null
  planId?: string | null
}) {
  const count =
    (item.serviceId ? 1 : 0) +
    (item.productId ? 1 : 0) +
    (item.appointmentId ? 1 : 0) +
    (item.planId ? 1 : 0)
  if (count === 0 || count !== 1) {
    throw new ItemNeedsServiceOrProductOrAppointmentError()
  }
}

export async function verifyStockProducts(
  productRepository: ProductRepository,
  productsToUpdate: ProductToUpdate[],
) {
  const stockService = new StockService(productRepository)
  await stockService.ensureAvailability(productsToUpdate)
}

export interface BuildItemDataOptions {
  saleItem: SaleItemBuildItem
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  planRepository: PlanRepository
  userUnitId?: string
  productsToUpdate?: ProductToUpdate[]
  barberUserRepository: BarberUsersRepository
  saleRepository: SaleRepository
  planProfileRepository: PlanProfileRepository
}

export async function buildItemData({
  saleItem,
  serviceRepository,
  productRepository,
  appointmentRepository,
  couponRepository,
  userUnitId,
  productsToUpdate,
  barberUserRepository,
  planRepository,
  saleRepository,
  planProfileRepository,
}: BuildItemDataOptions): Promise<ReturnBuildItemData> {
  const builder = new SaleItemDataBuilder({
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  })

  return builder.build(saleItem, {
    userUnitId,
    productsToUpdate,
  })
}
export async function updateDiscountsOnSaleItem(
  saleItem: ReturnBuildItemData,
  saleItemId: string,
  saleItemRepository: SaleItemRepository,
  tx: Prisma.TransactionClient,
) {
  const discountSync = new DiscountSyncService(saleItemRepository)
  await discountSync.sync(saleItem, saleItemId, tx)
}

export async function checkAndRecalculateAffectedSales(
  profileId: string,
  recalcService: RecalculateUserSalesService,
  profilesRepo: ProfilesRepository,
  tx?: Prisma.TransactionClient,
) {
  const profile = await profilesRepo.findById(profileId)
  const userId = profile?.user.id
  if (userId) {
    const ctx = tx ? { tx } : undefined
    await recalcService.execute({ userIds: [userId] }, ctx)
  }
}

export function calculateRealValueSaleItem(
  price: number,
  discounts: NewDiscount[],
) {
  const realValue = price
  const discountsOrder = discounts?.sort((a, b) => a.order - b.order) ?? []
  const realValueWithDiscounts = discountsOrder.reduce((acc, discount) => {
    if (discount.type === 'VALUE') {
      const discountValue = discount.amount
      logger.debug('Applying value discount', { discountValue })
      return acc - discountValue
    }
    if (discount.type === 'PERCENTAGE') {
      const discountValue = (acc * discount.amount) / 100
      logger.debug('Applying percentage discount', { discountValue })
      return acc - discountValue
    }
    return acc
  }, realValue)
  return realValueWithDiscounts >= 0 ? realValueWithDiscounts : 0
}

export function mountSaleItemUpdate(
  saleItemUpdateFields: SaleItemUpdateFields,
  saleItemCurrent: NonNullable<DetailedSaleItemFindMany>,
): CreateSaleItem {
  return {
    id: saleItemCurrent.id,
    price: saleItemCurrent.price,
    quantity:
      saleItemUpdateFields.quantity !== undefined
        ? saleItemUpdateFields.quantity
        : saleItemCurrent.quantity,
    appointmentId:
      saleItemUpdateFields.appointmentId !== undefined
        ? saleItemUpdateFields.appointmentId
        : saleItemCurrent.appointmentId,
    barberId:
      saleItemUpdateFields.barberId !== undefined
        ? saleItemUpdateFields.barberId
        : saleItemCurrent.barberId,
    couponId:
      saleItemUpdateFields.couponId !== undefined
        ? saleItemUpdateFields.couponId
        : saleItemCurrent.couponId,
    customPrice:
      saleItemUpdateFields.customPrice !== undefined
        ? saleItemUpdateFields.customPrice
        : saleItemCurrent.customPrice,
    planId:
      saleItemUpdateFields.planId !== undefined
        ? saleItemUpdateFields.planId
        : saleItemCurrent.planId,
    productId:
      saleItemUpdateFields.productId !== undefined
        ? saleItemUpdateFields.productId
        : saleItemCurrent.productId,
    serviceId:
      saleItemUpdateFields.serviceId !== undefined
        ? saleItemUpdateFields.serviceId
        : saleItemCurrent.serviceId,
  }
}
