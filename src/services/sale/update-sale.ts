import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { UpdateSaleRequest, CreateSaleItem, TempItems } from './types'
import { PaymentStatus } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyCouponToItems } from './utils/coupon'
import { buildItemData } from './utils/item'

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

    const tempItems: TempItems[] = []
    const appointmentsToLink: string[] = []
    if (items) {
      for (const it of items) {
        const built = await buildItemData({
          item: it,
          serviceRepository: this.serviceRepository,
          productRepository: this.productRepository,
          appointmentRepository: this.appointmentRepository,
          couponRepository: this.couponRepository,
          enforceSingleType: false,
        })
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
