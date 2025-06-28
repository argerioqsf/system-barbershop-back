import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { UpdateSaleRequest, CreateSaleItem } from './types'
import { Prisma, PaymentStatus, DiscountType } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyCouponToSale, applyCouponToItems } from './utils/coupon'

interface UpdateSaleResponse {
  sale: DetailedSale
}

export class UpdateSaleService {
  constructor(
    private repository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
  ) {}

  private async buildItemData(item: CreateSaleItem): Promise<{
    data: Prisma.SaleItemCreateWithoutSaleInput
    price: number
    ownDiscount: boolean
  }> {
    let basePrice = 0
    const data: Prisma.SaleItemCreateWithoutSaleInput = {
      quantity: item.quantity,
      price: 0,
    }

    if (item.serviceId) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      basePrice = service.price * item.quantity
      data.service = { connect: { id: item.serviceId } }
    } else if (item.productId) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) throw new Error('Product not found')
      basePrice = product.price * item.quantity
      data.product = { connect: { id: item.productId } }
    } else if (item.appointmentId) {
      const appointment = await this.appointmentRepository.findById(
        item.appointmentId,
      )
      if (!appointment) throw new Error('Appointment not found')
      if (appointment.saleItem) throw new Error('Appointment already linked')
      if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW')
        throw new Error('Invalid appointment status')
      basePrice = appointment.services.reduce(
        (acc, s) => acc + (s.service.price ?? 0),
        0,
      )
      data.appointment = { connect: { id: item.appointmentId } }
      data.barber = item.barberId
        ? { connect: { id: item.barberId } }
        : { connect: { id: appointment.barberId } }
    } else {
      throw new Error('Item must have serviceId or productId or appointmentId')
    }

    if (item.barberId && !data.barber) {
      data.barber = { connect: { id: item.barberId } }
    }

    let price = basePrice
    let discount = 0
    let discountType: DiscountType | null = null
    let ownDiscount = false

    const couponResult = await applyCouponToSale(
      item,
      price,
      basePrice,
      discount,
      discountType,
      ownDiscount,
      this.couponRepository,
    )
    price = couponResult.price
    discount = couponResult.discount
    discountType = couponResult.discountType
    const couponRel = couponResult.couponRel
    ownDiscount = couponResult.ownDiscount

    data.price = price
    data.discount = discountType ? discount : null
    data.discountType = discountType
    if (couponRel) data.coupon = couponRel

    return { data, price, ownDiscount }
  }

  async execute({
    id,
    observation,
    method,
    paymentStatus,
    items,
    removeItemIds,
    couponCode,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const current = await this.repository.findById(id)
    if (!current) throw new Error('Sale not found')
    if (current.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    const tempItems: {
      data: Prisma.SaleItemCreateWithoutSaleInput
      price: number
      ownDiscount: boolean
    }[] = []
    const appointmentsToLink: string[] = []
    if (items) {
      for (const it of items) {
        const built = await this.buildItemData(it)
        tempItems.push(built)
        if (it.appointmentId) appointmentsToLink.push(it.appointmentId)
      }
    }

    let subtractTotal = 0
    if (removeItemIds) {
      for (const idToRemove of removeItemIds) {
        const found = current.items.find((i) => i.id === idToRemove)
        if (found) subtractTotal += found.price
      }
    }

    let couponConnect: { connect: { id: string } } | undefined

    if (couponCode) {
      couponConnect = await applyCouponToItems(
        tempItems,
        couponCode,
        this.couponRepository,
      )
    }

    const total =
      current.total +
      tempItems.reduce((acc, t) => acc + t.price, 0) -
      subtractTotal

    const sale = await this.repository.update(id, {
      observation,
      method,
      paymentStatus,
      total,
      items: {
        create: tempItems.map((t) => t.data),
        deleteMany: removeItemIds?.map((rid) => ({ id: rid })),
      },
      coupon: couponConnect,
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
