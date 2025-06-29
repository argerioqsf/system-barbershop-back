import { Prisma, SaleItem, Transaction } from '@prisma/client'
import {
  SaleItemRepository,
  DetailedSaleItemFindMany,
} from '../sale-item-repository'
import { InMemorySaleRepository } from './in-memory-sale-repository'

export class InMemorySaleItemRepository implements SaleItemRepository {
  constructor(private saleRepository: InMemorySaleRepository) {}

  async update(
    id: string,
    data: Prisma.SaleItemUpdateInput,
  ): Promise<SaleItem> {
    for (const sale of this.saleRepository.sales) {
      const item = sale.items.find((i) => i.id === id)
      if (item) {
        if (data.porcentagemBarbeiro !== undefined) {
          item.porcentagemBarbeiro = data.porcentagemBarbeiro as number | null
        }
        const updateData = data as unknown as { commissionPaid?: boolean }
        if (updateData.commissionPaid !== undefined) {
          ;(item as unknown as { commissionPaid: boolean }).commissionPaid =
            updateData.commissionPaid
        }
        return item
      }
    }
    throw new Error('Sale item not found')
  }

  async findMany(
    where: Prisma.SaleItemWhereInput = {},
  ): Promise<DetailedSaleItemFindMany[]> {
    const items: DetailedSaleItemFindMany[] = []

    const matches = (
      item: DetailedSaleItemFindMany,
      conditions: Prisma.SaleItemWhereInput,
    ): boolean => {
      if (
        conditions.id &&
        typeof conditions.id === 'object' &&
        'in' in conditions.id
      ) {
        if (!conditions.id.in?.includes(item.id)) return false
      }
      if (conditions.barberId && item.barberId !== conditions.barberId) {
        return false
      }
      if (conditions.commissionPaid !== undefined) {
        if (
          (item as unknown as { commissionPaid?: boolean }).commissionPaid !==
          conditions.commissionPaid
        )
          return false
      }
      if (
        conditions.sale &&
        'paymentStatus' in (conditions.sale as { paymentStatus: string })
      ) {
        if (
          item.sale.paymentStatus !==
          (conditions.sale as { paymentStatus: string }).paymentStatus
        )
          return false
      }
      if (
        conditions.appointmentId &&
        typeof conditions.appointmentId === 'object' &&
        'not' in conditions.appointmentId
      ) {
        const notNull = conditions.appointmentId.not === null
        if (notNull && item.appointmentId === null) return false
      }
      if (conditions.appointment && conditions.appointment.services) {
        const every = conditions.appointment.services.every as {
          id?: { in: string[] }
        }
        if (every?.id?.in) {
          const ids = every.id.in
          if (
            !(
              item.appointment?.services.every((s) => ids.includes(s.id)) ??
              false
            )
          ) {
            return false
          }
        }
      }
      if (conditions.OR && Array.isArray(conditions.OR)) {
        const orPass = conditions.OR.some((c) => {
          if (
            c.serviceId &&
            typeof c.serviceId === 'object' &&
            'not' in c.serviceId
          ) {
            if (c.serviceId.not === null) return item.serviceId !== null
          }
          if (
            c.productId &&
            typeof c.productId === 'object' &&
            'not' in c.productId
          ) {
            if (c.productId.not === null) return item.productId !== null
          }
          return false
        })
        if (!orPass) return false
      }
      return true
    }

    for (const sale of this.saleRepository.sales) {
      for (const item of sale.items) {
        const castItem = item as unknown as DetailedSaleItemFindMany & {
          transactions?: Transaction[]
        }
        const fullItem: DetailedSaleItemFindMany = {
          ...castItem,
          sale,
          transactions: castItem.transactions ?? [],
        }
        if (matches(fullItem, where)) {
          items.push(fullItem)
        }
      }
    }

    return items
  }
}
