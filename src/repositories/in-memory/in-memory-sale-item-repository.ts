import {
  Prisma,
  Sale,
  SaleItem,
  PaymentStatus,
  Discount,
  DiscountOrigin,
  DiscountType,
} from '@prisma/client'
import { DetailedSale, DetailedSaleItem } from '../sale-repository'
import crypto from 'node:crypto'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
  DetailedSaleItemFindById,
  ReturnFindManyPendingCommission,
} from '../sale-item-repository'
import { InMemorySaleRepository } from './in-memory-sale-repository'

const DEFAULT_DISCOUNT_TYPE = DiscountType.VALUE
const DEFAULT_DISCOUNT_ORIGIN = DiscountOrigin.VALUE_SALE_ITEM

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (isObject(value) && 'toNumber' in value) {
    const candidate = value as { toNumber?: () => number }
    if (typeof candidate.toNumber === 'function') {
      return candidate.toNumber()
    }
  }
  const coerced = Number(value)
  return Number.isNaN(coerced) ? fallback : coerced
}

function resolveNullableNumber(
  value: unknown,
  fallback: number | null,
): number | null {
  if (value === undefined) return fallback
  if (value === null) return null
  if (isObject(value) && 'set' in value) {
    const setValue = (value as { set?: unknown }).set
    return resolveNullableNumber(setValue ?? null, fallback)
  }
  return toNumber(value, fallback ?? 0)
}

function resolveBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  if (isObject(value) && 'set' in value) {
    const setValue = (value as { set?: boolean }).set
    return setValue ?? fallback
  }
  return Boolean(value)
}

export class InMemorySaleItemRepository implements SaleItemRepository {
  constructor(private saleRepository: InMemorySaleRepository) {}

  private cloneAppointment(
    appointment: DetailedSaleItem['appointment'],
  ): DetailedSaleItem['appointment'] {
    if (!appointment) return null
    const services =
      appointment.services?.map((service) => ({ ...service })) ?? []
    return {
      ...appointment,
      services,
    }
  }

  private mapDiscountPayload(
    saleItemId: string,
    payload:
      | Prisma.DiscountCreateWithoutSaleItemInput
      | Prisma.DiscountUncheckedCreateWithoutSaleItemInput
      | Prisma.DiscountCreateManySaleItemInput,
  ): Discount {
    const amount = toNumber((payload as { amount?: unknown }).amount, 0)
    const type =
      (payload as { type?: DiscountType }).type ?? DEFAULT_DISCOUNT_TYPE
    const origin =
      (payload as { origin?: DiscountOrigin }).origin ?? DEFAULT_DISCOUNT_ORIGIN
    const orderValue = (payload as { order?: unknown }).order
    const order = orderValue === undefined ? 0 : toNumber(orderValue, 0)
    const id = (payload as { id?: string }).id ?? crypto.randomUUID()

    return {
      id,
      saleItemId,
      amount,
      type,
      origin,
      order,
    }
  }

  private buildDiscountsFromUpdate(
    saleItemId: string,
    input: Prisma.SaleItemUpdateInput['discounts'],
  ): Discount[] {
    if (!input || !isObject(input)) return []

    const discounts: Discount[] = []

    if ('create' in input && input.create) {
      const creations = Array.isArray(input.create)
        ? input.create
        : [input.create]
      discounts.push(
        ...creations.map((payload) =>
          this.mapDiscountPayload(saleItemId, payload),
        ),
      )
    }

    if ('createMany' in input && input.createMany?.data) {
      const bulkData = input.createMany.data
      const entries = Array.isArray(bulkData) ? bulkData : [bulkData]
      discounts.push(
        ...entries.map((payload) =>
          this.mapDiscountPayload(saleItemId, payload),
        ),
      )
    }

    return discounts
  }

  private buildDetailedItem(
    sale: DetailedSale,
    item: DetailedSaleItem,
  ): DetailedSaleItemFindById {
    const saleSnapshot: Sale = {
      id: sale.id,
      userId: sale.userId,
      clientId: sale.clientId,
      unitId: sale.unitId,
      sessionId: sale.sessionId,
      couponId: sale.couponId,
      total: sale.total,
      gross_value: sale.gross_value,
      method: sale.method,
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt,
      observation: sale.observation,
      status: sale.status,
      completionDate: sale.completionDate,
    }

    return {
      ...item,
      sale: saleSnapshot,
      discounts: item.discounts.map((discount) => ({ ...discount })),
      transactions: [],
      appointment: this.cloneAppointment(item.appointment) as any,
    }
  }

  async updateManyIndividually(
    updates: { id: string; data: Prisma.SaleItemUpdateInput }[],
  ): Promise<SaleItem[]> {
    const updatedItems: SaleItem[] = []

    for (const { id, data } of updates) {
      const updatedItem = await this.update(id, data)
      updatedItems.push(updatedItem)
    }

    return updatedItems
  }

  async update(
    id: string,
    data: Prisma.SaleItemUpdateInput,
  ): Promise<SaleItem> {
    for (const sale of this.saleRepository.sales) {
      const item = sale.items.find((saleItem) => saleItem.id === id)
      if (!item) continue

      if (data.price !== undefined) {
        item.price = toNumber(data.price, item.price)
      }

      if (data.discounts !== undefined) {
        item.discounts = this.buildDiscountsFromUpdate(id, data.discounts)
      }

      if (data.porcentagemBarbeiro !== undefined) {
        item.porcentagemBarbeiro = resolveNullableNumber(
          data.porcentagemBarbeiro,
          item.porcentagemBarbeiro,
        )
      }

      if (data.commissionPaid !== undefined) {
        item.commissionPaid = resolveBoolean(
          data.commissionPaid,
          item.commissionPaid,
        )
      }

      return item
    }
    throw new Error('Sale item not found')
  }

  async findById(id: string): Promise<DetailedSaleItemFindById | null> {
    for (const sale of this.saleRepository.sales) {
      const item = sale.items.find((saleItem) => saleItem.id === id)
      if (!item) continue
      return this.buildDetailedItem(sale, item)
    }
    return null
  }

  async findMany(
    where: Prisma.SaleItemWhereInput = {},
  ): Promise<DetailedSaleItemFindMany[]> {
    const items: DetailedSaleItemFindMany[] = []

    for (const sale of this.saleRepository.sales) {
      for (const item of sale.items) {
        if (where.barberId && item.barberId !== where.barberId) continue

        if (
          where.sale &&
          'paymentStatus' in (where.sale as { paymentStatus?: PaymentStatus })
        ) {
          const status = (where.sale as { paymentStatus?: PaymentStatus })
            .paymentStatus
          if (status && sale.paymentStatus !== status) continue
        }

        if (
          where.commissionPaid !== undefined &&
          item.commissionPaid !== where.commissionPaid
        )
          continue

        if (
          where.id &&
          typeof where.id === 'object' &&
          'in' in where.id &&
          Array.isArray(where.id.in)
        ) {
          if (!where.id.in.includes(item.id)) continue
        } else if (typeof where.id === 'string' && item.id !== where.id) {
          continue
        }

        if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
          let orMatch = false
          for (const condition of where.OR) {
            const cond = condition as Prisma.SaleItemWhereInput
            const ands: Prisma.SaleItemWhereInput[] = Array.isArray(cond.AND)
              ? cond.AND
              : [cond.AND ?? cond]
            const match = ands.every((c) => {
              if (
                c.serviceId &&
                typeof c.serviceId === 'object' &&
                'not' in c.serviceId &&
                c.serviceId.not === null &&
                item.serviceId === null
              )
                return false
              if (
                c.productId &&
                typeof c.productId === 'object' &&
                'not' in c.productId &&
                c.productId.not === null &&
                item.productId === null
              )
                return false
              if (
                c.id &&
                typeof c.id === 'object' &&
                'in' in c.id &&
                Array.isArray(c.id.in) &&
                !c.id.in.includes(item.id)
              )
                return false
              return true
            })
            if (match) {
              orMatch = true
              break
            }
          }
          if (!orMatch) continue
        }

        if (
          where.appointmentId &&
          typeof where.appointmentId === 'object' &&
          'not' in where.appointmentId
        ) {
          if (where.appointmentId.not === null && item.appointmentId === null)
            continue
        }

        if (
          where.appointment &&
          'services' in where.appointment &&
          where.appointment.services &&
          'every' in where.appointment.services &&
          where.appointment.services.every &&
          'id' in where.appointment.services.every &&
          where.appointment.services.every.id &&
          typeof where.appointment.services.every.id === 'object' &&
          'in' in where.appointment.services.every.id
        ) {
          const ids = where.appointment.services.every.id.in as string[]
          const appointment = item.appointment
          if (
            !appointment ||
            !appointment.services?.every((s) => ids.includes(s.id))
          ) {
            continue
          }
        }

        items.push(this.buildDetailedItem(sale, item))
      }
    }

    return items
  }

  async findManyFilterAppointmentService(
    where: Prisma.SaleItemWhereInput = {},
    appointmentServiceIds: string[] = [],
  ): Promise<DetailedSaleItemFindMany[]> {
    const items: DetailedSaleItemFindMany[] = []

    for (const sale of this.saleRepository.sales) {
      for (const item of sale.items) {
        if (where.barberId && item.barberId !== where.barberId) continue

        if (
          where.sale &&
          'paymentStatus' in (where.sale as { paymentStatus?: PaymentStatus })
        ) {
          const status = (where.sale as { paymentStatus?: PaymentStatus })
            .paymentStatus
          if (status && sale.paymentStatus !== status) continue
        }

        if (
          where.commissionPaid !== undefined &&
          item.commissionPaid !== where.commissionPaid
        )
          continue

        if (
          where.id &&
          typeof where.id === 'object' &&
          'in' in where.id &&
          Array.isArray(where.id.in)
        ) {
          if (!where.id.in.includes(item.id)) continue
        } else if (typeof where.id === 'string' && item.id !== where.id) {
          continue
        }

        if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
          let orMatch = false
          for (const condition of where.OR) {
            const cond = condition as Prisma.SaleItemWhereInput
            const ands: Prisma.SaleItemWhereInput[] = Array.isArray(cond.AND)
              ? cond.AND
              : [cond.AND ?? cond]
            const match = ands.every((c) => {
              if (
                c.serviceId &&
                typeof c.serviceId === 'object' &&
                'not' in c.serviceId &&
                c.serviceId.not === null &&
                item.serviceId === null
              )
                return false
              if (
                c.productId &&
                typeof c.productId === 'object' &&
                'not' in c.productId &&
                c.productId.not === null &&
                item.productId === null
              )
                return false
              if (
                c.appointmentId &&
                typeof c.appointmentId === 'object' &&
                'not' in c.appointmentId &&
                c.appointmentId.not === null &&
                item.appointmentId === null
              )
                return false
              if (
                c.id &&
                typeof c.id === 'object' &&
                'in' in c.id &&
                Array.isArray(c.id.in) &&
                !c.id.in.includes(item.id)
              )
                return false
              if (
                c.appointment &&
                'services' in c.appointment &&
                c.appointment.services &&
                'some' in c.appointment.services &&
                c.appointment.services.some &&
                'id' in c.appointment.services.some &&
                c.appointment.services.some.id &&
                typeof c.appointment.services.some.id === 'object' &&
                'in' in c.appointment.services.some.id
              ) {
                const ids = c.appointment.services.some.id.in as string[]
                const appointment = item.appointment
                if (
                  !appointment ||
                  !appointment.services?.some((s) => ids.includes(s.id))
                ) {
                  return false
                }
              }
              return true
            })
            if (match) {
              orMatch = true
              break
            }
          }
          if (!orMatch) continue
        }

        if (
          where.appointmentId &&
          typeof where.appointmentId === 'object' &&
          'not' in where.appointmentId
        ) {
          if (where.appointmentId.not === null && item.appointmentId === null)
            continue
        }

        if (
          where.appointment &&
          'services' in where.appointment &&
          where.appointment.services &&
          'every' in where.appointment.services &&
          where.appointment.services.every &&
          'id' in where.appointment.services.every &&
          where.appointment.services.every.id &&
          typeof where.appointment.services.every.id === 'object' &&
          'in' in where.appointment.services.every.id
        ) {
          const ids = where.appointment.services.every.id.in as string[]
          const appointment = item.appointment
          if (
            !appointment ||
            !appointment.services?.every((s) => ids.includes(s.id))
          ) {
            continue
          }
        }

        const detailedItem = this.buildDetailedItem(sale, item)

        if (
          appointmentServiceIds.length > 0 &&
          detailedItem.appointment &&
          detailedItem.appointment.services.length > 0
        ) {
          const filtered = {
            ...detailedItem,
            appointment: {
              ...detailedItem.appointment,
              services: detailedItem.appointment.services.filter((service) =>
                appointmentServiceIds.includes(service.id),
              ),
            },
          }
          items.push(filtered)
          continue
        }

        items.push(detailedItem)
      }
    }

    return items
  }

  async findManyByBarberId(
    barberId: string,
  ): Promise<DetailedSaleItemFindMany[]> {
    const items: DetailedSaleItemFindMany[] = []
    for (const sale of this.saleRepository.sales) {
      for (const item of sale.items) {
        if (item.barberId !== barberId) continue
        items.push(this.buildDetailedItem(sale, item))
      }
    }
    return items
  }

  async findManyPendingCommission(
    barberId: string,
  ): Promise<ReturnFindManyPendingCommission[]> {
    const items: ReturnFindManyPendingCommission[] = []
    for (const sale of this.saleRepository.sales) {
      for (const item of sale.items) {
        if (
          item.barberId === barberId &&
          item.commissionPaid === false &&
          sale.paymentStatus === 'PAID'
        ) {
          items.push({
            ...this.buildDetailedItem(sale, item),
            product: null,
            service: null,
          })
        }
      }
    }
    return items
  }
}
