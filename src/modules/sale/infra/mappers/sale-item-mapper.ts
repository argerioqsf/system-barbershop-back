import { Prisma } from '@prisma/client'

import { DetailedSaleItem } from '@/repositories/sale-repository'
import {
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/modules/sale/application/dto/sale-item-dto'

export function mapDetailedSaleItemToBuild(
  saleId: string,
  item: DetailedSaleItem,
): SaleItemBuildItem {
  return {
    saleId,
    id: item.id,
    serviceId: item.serviceId ?? undefined,
    productId: item.productId ?? undefined,
    appointmentId: item.appointmentId ?? undefined,
    planId: item.planId ?? undefined,
    barberId: item.barberId ?? undefined,
    couponId: item.couponId ?? undefined,
    quantity: item.quantity,
    price: item.price,
    customPrice: item.customPrice ?? undefined,
  }
}

export function mapSaleItemToPrismaCreate(
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
    customPrice:
      saleItem.customPrice === undefined ? undefined : saleItem.customPrice,
    discounts: {
      create: saleItem.discounts.map((discount) => ({
        amount: discount.amount,
        type: discount.type,
        origin: discount.origin,
        order: discount.order,
      })),
    },
    appointment: saleItem.appointment
      ? { connect: { id: saleItem.appointment.id } }
      : undefined,
    commissionPaid: saleItem.commissionPaid ?? false,
  }
}

export function mapSaleItemToPrismaUpdate(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemUpdateInput {
  return {
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
    customPrice: saleItem.customPrice ?? undefined,
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
