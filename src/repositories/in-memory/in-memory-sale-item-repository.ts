import { Prisma, SaleItem, PaymentStatus } from '@prisma/client'
import { DetailedSaleItem } from '../sale-repository'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
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
        const extra = data as { commissionPaid?: boolean }
        if (extra.commissionPaid !== undefined) {
          ;(item as unknown as { commissionPaid: boolean }).commissionPaid =
            extra.commissionPaid
        }
        return item
      }
    }
    throw new Error('Sale item not found')
  }

  async findById(id: string): Promise<DetailedSaleItemFindMany | null> {
    for (const sale of this.saleRepository.sales) {
      const item = sale.items.find((i) => i.id === id)
      if (item) {
        return { ...(item as DetailedSaleItem), sale } as unknown as DetailedSaleItemFindMany
      }
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

        items.push({
          ...(item as DetailedSaleItem),
          sale,
        } as unknown as DetailedSaleItemFindMany)
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

        const cloned = {
          ...(item as DetailedSaleItem),
          sale,
        } as unknown as DetailedSaleItemFindMany

        if (appointmentServiceIds.length > 0 && cloned.appointment) {
          cloned.appointment = {
            ...cloned.appointment,
            services:
              cloned.appointment.services?.filter((svc) =>
                appointmentServiceIds.includes(svc.id),
              ) ?? [],
          }
        }

        items.push(cloned)
      }
    }

    return items
  }
}
