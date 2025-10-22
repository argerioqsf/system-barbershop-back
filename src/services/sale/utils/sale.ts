import { CouponRepository } from '@/repositories/coupon-repository'
import { ProductRepository } from '@/repositories/product-repository'
import {
  DetailedSaleItem,
  SaleRepository,
} from '@/repositories/sale-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { Prisma } from '@prisma/client'
import { calculateRealValueSaleItem } from './item'
import { applyCouponSale } from './coupon'
import { StockService } from '@/modules/sale/application/services/stock-service'
import { mapSaleItemToPrismaCreate } from '@/modules/sale/infra/mappers/sale-item-mapper'
import { DetailedSaleItemFindById } from '@/repositories/sale-item-repository'
import { CreateSaleItem } from '@/modules/sale/application/dto/sale'
import { SaleTotalsService } from '@/modules/sale/application/services/sale-totals-service'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'

export function mapToSaleItem(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemCreateWithoutSaleInput {
  // MIGRATION-TODO: remover wrapper quando todos os consumidores usarem o mapper do módulo
  return mapSaleItemToPrismaCreate(saleItem)
}

export function mapToSaleItemForUpdate(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemUpdateWithoutSaleInput {
  return {
    id: saleItem.id,
    coupon:
      saleItem.coupon === null
        ? { disconnect: true }
        : saleItem.coupon
        ? { connect: { id: saleItem.coupon.id } }
        : undefined,
    quantity: saleItem.quantity,
    service:
      saleItem.service === null
        ? { disconnect: true }
        : saleItem.service
        ? { connect: { id: saleItem.service.id } }
        : undefined,
    product:
      saleItem.product === null
        ? { disconnect: true }
        : saleItem.product
        ? { connect: { id: saleItem.product.id } }
        : undefined,
    plan:
      saleItem.plan === null
        ? { disconnect: true }
        : saleItem.plan
        ? { connect: { id: saleItem.plan.id } }
        : undefined,
    barber:
      saleItem.barber === null
        ? { disconnect: true }
        : saleItem.barber
        ? { connect: { id: saleItem.barber.id } }
        : undefined,
    price: saleItem.price,
    customPrice: saleItem.customPrice,
    discounts: {
      deleteMany: {},
      create: saleItem.discounts.map((discount) => ({
        amount: discount.amount,
        type: discount.type,
        origin: discount.origin,
        order: discount.order,
      })),
    },
    appointment:
      saleItem.appointment === null
        ? { disconnect: true }
        : saleItem.appointment
        ? { connect: { id: saleItem.appointment.id } }
        : undefined,
  }
}

export function mapToSaleItemsForUpdate(
  saleItems: ReturnBuildItemData[],
): Prisma.SaleItemUpdateWithoutSaleInput[] {
  return saleItems.map(
    (saleItem): Prisma.SaleItemUpdateWithoutSaleInput =>
      mapToSaleItemForUpdate(saleItem),
  )
}
export function mapToSaleItems(
  saleItems: ReturnBuildItemData[],
): Prisma.SaleItemCreateWithoutSaleInput[] {
  return saleItems.map(
    (saleItem): Prisma.SaleItemCreateWithoutSaleInput =>
      mapToSaleItem(saleItem),
  )
}

export function calculateTotal(saleItemsBuild: ReturnBuildItemData[]): number {
  return saleItemsBuild.reduce((acc, i) => {
    const realPriceItem = calculateRealValueSaleItem(i.basePrice, i.discounts)
    return acc + realPriceItem
  }, 0)
}

export function calculateGrossTotal(
  saleItemsBuild: ReturnBuildItemData[],
): number {
  return saleItemsBuild.reduce((acc, i) => acc + i.basePrice, 0)
}

export async function updateProductsStock(
  repository: ProductRepository,
  products: { id: string; quantity: number }[],
  mode: 'increment' | 'decrement' = 'decrement',
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const stockService = new StockService(repository)
  await stockService.adjust(products, mode, tx)
}

export async function updateCouponsStock(
  repository: CouponRepository,
  items: DetailedSaleItem[],
  mode: 'increment' | 'decrement' = 'decrement',
  tx?: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    if (!item.couponId) continue
    await repository.update(
      item.couponId,
      {
        quantity: { [mode]: 1 },
      },
      tx,
    )
  }
}

export interface RebuildSaleItemsOptions {
  couponId?: string
  clientId: string
  planProfileRepository: PlanProfileRepository
  planRepository: PlanRepository
  couponRepository: CouponRepository
}

export async function rebuildSaleItems(
  saleItems: ReturnBuildItemData[],
  { couponId, couponRepository }: RebuildSaleItemsOptions,
): Promise<ReturnBuildItemData[]> {
  let updatedItems = saleItems

  if (couponId) {
    const { saleItems } = await applyCouponSale(
      updatedItems,
      couponId,
      couponRepository,
    )
    updatedItems = saleItems
  }

  return updatedItems
}

export type GetItemsBuildReturn = {
  saleItemsBuild: ReturnBuildItemData[]
}

export async function recalculateSaleTotalsOnItemChange(
  saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
  saleItemUpdated: CreateSaleItem,
  saleRepository: SaleRepository,
  couponRepository: CouponRepository,
): Promise<{
  itemsForUpdate: ReturnBuildItemData[]
  totalSale: number
  grossTotalSale: number
}> {
  const saleTotalsService = new SaleTotalsService(
    saleRepository,
    couponRepository,
  )

  return saleTotalsService.recalculateSaleTotalsOnItemChange({
    currentItem: saleItemCurrent,
    updatedItem: saleItemUpdated,
  })
}
