import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository, DetailedAppointment } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Prisma, DiscountType, Service, Product } from '@prisma/client'
import { CreateSaleItem, TempItems } from '../types'
import { ItemNeedsServiceOrProductOrAppointmentError } from '../../@errors/sale/item-needs-service-or-product-error'
import { ServiceNotFoundError } from '../../@errors/service/service-not-found-error'
import { ServiceNotFromUserUnitError } from '../../@errors/service/service-not-from-user-unit-error'
import { ProductNotFoundError } from '../../@errors/product/product-not-found-error'
import { InsufficientStockError } from '../../@errors/product/insufficient-stock-error'
import { AppointmentAlreadyLinkedError } from '../../@errors/appointment/appointment-already-linked-error'
import { AppointmentNotFoundError } from '../../@errors/appointment/appointment-not-found-error'
import { InvalidAppointmentStatusError } from '../../@errors/appointment/invalid-appointment-status-error'
import { BarberNotFoundError } from '../../@errors/barber/barber-not-found-error'
import { ProfileNotFoundError } from '../../@errors/profile/profile-not-found-error'
import { BarberNotFromUserUnitError } from '../../@errors/barber/barber-not-from-user-unit-error'
import { BarberCannotSellItemError } from '../../@errors/barber/barber-cannot-sell-item'
import { PermissionName } from '@prisma/client'
import { hasPermission } from '@/utils/permissions'
import { applyCouponToSale } from './coupon'

export interface BuildItemDataOptions {
  item: CreateSaleItem
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  userUnitId?: string
  productsToUpdate?: { id: string; quantity: number }[]
  barberUserRepository?: BarberUsersRepository
  enforceSingleType?: boolean
}

export async function buildItemData({
  item,
  serviceRepository,
  productRepository,
  appointmentRepository,
  couponRepository,
  userUnitId,
  productsToUpdate,
  barberUserRepository,
  enforceSingleType = true,
}: BuildItemDataOptions): Promise<TempItems> {
  const countIds =
    (item.serviceId ? 1 : 0) +
    (item.productId ? 1 : 0) +
    (item.appointmentId ? 1 : 0)
  if (countIds === 0 || (enforceSingleType && countIds !== 1)) {
    throw new ItemNeedsServiceOrProductOrAppointmentError()
  }

  let basePrice = 0
  const dataItem: Prisma.SaleItemCreateWithoutSaleInput = {
    quantity: item.quantity,
  }

  let service: Service | null = null
  let product: Product | null = null
  let appointment: DetailedAppointment | null = null
  let barberId: string | undefined = item.barberId

  if (item.serviceId) {
    service = await serviceRepository.findById(item.serviceId)
    if (!service) throw new ServiceNotFoundError()
    if (userUnitId && service.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    basePrice = service.price * item.quantity
    dataItem.service = { connect: { id: item.serviceId } }
  } else if (item.productId) {
    product = await productRepository.findById(item.productId)
    if (!product) throw new ProductNotFoundError()
    if (userUnitId && product.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    if (typeof product.quantity === 'number' && product.quantity < item.quantity) {
      throw new InsufficientStockError()
    }
    basePrice = product.price * item.quantity
    dataItem.product = { connect: { id: item.productId } }
    if (productsToUpdate) {
      productsToUpdate.push({ id: item.productId, quantity: item.quantity })
    }
  } else if (item.appointmentId) {
    appointment = await appointmentRepository.findById(item.appointmentId)
    if (!appointment) throw new AppointmentNotFoundError()
    if (appointment.saleItem) throw new AppointmentAlreadyLinkedError()
    if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW') {
      throw new InvalidAppointmentStatusError()
    }
    if (userUnitId && appointment.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    const appointmentTotal = appointment.services.reduce((acc, s) => {
      return acc + (s.service.price ?? 0)
    }, 0)
    basePrice = appointmentTotal
    dataItem.appointment = { connect: { id: item.appointmentId } }
    barberId = barberId ?? appointment.barberId
  }

  let price = basePrice
  let discount = 0
  let discountType: DiscountType | null = null
  let couponRel: { connect: { id: string } } | undefined
  let ownDiscount = false

  if (barberId && barberUserRepository) {
    const barber = await barberUserRepository.findById(barberId)
    if (!barber) throw new BarberNotFoundError()
    if (!barber.profile) throw new ProfileNotFoundError()
    if (userUnitId && barber.unitId !== userUnitId) {
      throw new BarberNotFromUserUnitError()
    }

    if (service) {
      if (
        !hasPermission(
          [PermissionName.SELL_SERVICE],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
      )
        throw new BarberCannotSellItemError(barber.name, service.name)
    } else if (product) {
      if (
        !hasPermission(
          [PermissionName.SELL_PRODUCT],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
      )
        throw new BarberCannotSellItemError(barber.name, product.name)
    } else if (appointment) {
      if (
        !hasPermission(
          [PermissionName.ACCEPT_APPOINTMENT],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
      )
        throw new BarberCannotSellItemError(barber.name, `Appointment: ${appointment.date}`)
    }
  }

  const result = await applyCouponToSale(
    item,
    price,
    basePrice,
    discount,
    discountType,
    ownDiscount,
    couponRepository,
    userUnitId,
    couponRel,
  )

  return {
    ...result,
    basePrice,
    data: {
      ...dataItem,
      barber: barberId ? { connect: { id: barberId } } : undefined,
      coupon: result.couponRel,
    },
  }
}
