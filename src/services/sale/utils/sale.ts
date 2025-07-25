import { CouponRepository } from '@/repositories/coupon-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { DetailedSaleItem } from '@/repositories/sale-repository'
import { Prisma } from '@prisma/client'
import { ReturnBuildItemData } from './item'

export function mapToSaleItem(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemCreateWithoutSaleInput {
  return {
    coupon: saleItem.coupon
      ? { connect: { id: saleItem.coupon.id } }
      : undefined,
    quantity: saleItem.quantity,
    service: saleItem.service
      ? { connect: { id: saleItem.service.id } }
      : undefined,
    product: saleItem.product
      ? { connect: { id: saleItem.product.id } }
      : undefined,
    plan: saleItem.plan ? { connect: { id: saleItem.plan.id } } : undefined,
    barber: saleItem.barber
      ? { connect: { id: saleItem.barber.id } }
      : undefined,
    price: saleItem.price,
    customPrice: saleItem.customPrice,
    discounts: {
      create: saleItem.discounts.map((d) => ({
        amount: d.amount,
        type: d.type,
        origin: d.origin,
        order: d.order,
      })),
    },
    appointment: saleItem.appointment
      ? { connect: { id: saleItem.appointment.id } }
      : undefined,
    commissionPaid: false,
  }
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
      create: saleItem.discounts.map((d) => ({
        amount: d.amount,
        type: d.type,
        origin: d.origin,
        order: d.order,
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
  return saleItemsBuild.reduce((acc, i) => acc + i.price, 0)
}

export async function updateProductsStock(
  repository: ProductRepository,
  products: { id: string; quantity: number }[],
  mode: 'increment' | 'decrement' = 'decrement',
  tx?: Prisma.TransactionClient,
): Promise<void> {
  for (const prod of products) {
    await repository.update(
      prod.id,
      {
        quantity: { [mode]: prod.quantity },
      },
      tx,
    )
  }
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
