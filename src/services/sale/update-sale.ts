import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { UpdateSaleRequest, CreateSaleItem } from './types'
import { Prisma, PaymentStatus } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'

interface UpdateSaleResponse {
  sale: DetailedSale
}

export class UpdateSaleService {
  constructor(
    private repository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  private async buildItemData(
    item: CreateSaleItem,
  ): Promise<Prisma.SaleItemCreateWithoutSaleInput & { price: number }> {
    let price = 0
    if (item.serviceId) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      price = service.price * item.quantity
      return {
        service: { connect: { id: item.serviceId } },
        quantity: item.quantity,
        price,
        discount: null,
        discountType: null,
        barber: item.barberId ? { connect: { id: item.barberId } } : undefined,
      }
    }
    if (item.productId) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) throw new Error('Product not found')
      price = product.price * item.quantity
      return {
        product: { connect: { id: item.productId } },
        quantity: item.quantity,
        price,
        discount: null,
        discountType: null,
        barber: item.barberId ? { connect: { id: item.barberId } } : undefined,
      }
    }
    if (item.appointmentId) {
      const appointment = await this.appointmentRepository.findById(
        item.appointmentId,
      )
      if (!appointment) throw new Error('Appointment not found')
      if (appointment.saleItem) throw new Error('Appointment already linked')
      if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW')
        throw new Error('Invalid appointment status')
      price = appointment.services.reduce(
        (acc, s) => acc + (s.service.price ?? 0),
        0,
      )
      return {
        appointment: { connect: { id: item.appointmentId } },
        quantity: item.quantity,
        price,
        discount: null,
        discountType: null,
        barber: item.barberId
          ? { connect: { id: item.barberId } }
          : { connect: { id: appointment.barberId } },
      }
    }
    throw new Error('Item must have serviceId or productId or appointmentId')
  }

  async execute({
    id,
    observation,
    method,
    paymentStatus,
    items,
    removeItemIds,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const current = await this.repository.findById(id)
    if (!current) throw new Error('Sale not found')
    if (current.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    const createItems: (Prisma.SaleItemCreateWithoutSaleInput & {
      price: number
      appointmentId?: string
    })[] = []
    const appointmentsToLink: string[] = []
    let addTotal = 0
    if (items) {
      for (const it of items) {
        const data = await this.buildItemData(it)
        createItems.push({ ...data, appointmentId: it.appointmentId })
        if (it.appointmentId) appointmentsToLink.push(it.appointmentId)
        addTotal += data.price
      }
    }

    let subtractTotal = 0
    if (removeItemIds) {
      for (const idToRemove of removeItemIds) {
        const found = current.items.find((i) => i.id === idToRemove)
        if (found) subtractTotal += found.price
      }
    }

    const total = current.total + addTotal - subtractTotal

    const sale = await this.repository.update(id, {
      observation,
      method,
      paymentStatus,
      total,
      items: {
        create: createItems.map((c) => ({
          ...c,
        })),
        deleteMany: removeItemIds?.map((rid) => ({ id: rid })),
      },
    })

    for (const item of sale.items) {
      if (
        item.appointmentId &&
        appointmentsToLink.includes(item.appointmentId)
      ) {
        await this.appointmentRepository.update(item.appointmentId, {
          saleItem: { connect: { id: item.id } },
          ...(sale.paymentStatus === PaymentStatus.PAID
            ? { status: 'CONCLUDED' }
            : {}),
        })
      } else if (
        item.appointmentId &&
        sale.paymentStatus === PaymentStatus.PAID
      ) {
        await this.appointmentRepository.update(item.appointmentId, {
          status: 'CONCLUDED',
        })
      }
    }

    return { sale }
  }
}
