import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Service, Product, PermissionName } from '@prisma/client'
import { PlanRepository } from '@/repositories/plan-repository'
import { CreateSaleItem, TempItems, DataItem } from '../types'
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
import { hasPermission } from '@/utils/permissions'
import { applyCouponToSale } from './coupon'

export interface BuildItemDataOptions {
  item: CreateSaleItem
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  planRepository?: PlanRepository
  userUnitId?: string
  productsToUpdate?: { id: string; quantity: number }[]
  barberUserRepository?: BarberUsersRepository
  enforceSingleType?: boolean
}

function ensureSingleType(item: CreateSaleItem, enforce: boolean) {
  const count =
    (item.serviceId ? 1 : 0) +
    (item.productId ? 1 : 0) +
    (item.appointmentId ? 1 : 0) +
    (item.planId ? 1 : 0)
  if (count === 0 || (enforce && count !== 1)) {
    throw new ItemNeedsServiceOrProductOrAppointmentError()
  }
}

async function loadService(
  serviceId: string,
  repo: ServiceRepository,
  userUnitId?: string,
) {
  const service = await repo.findById(serviceId)
  if (!service) throw new ServiceNotFoundError()
  if (userUnitId && service.unitId !== userUnitId) {
    throw new ServiceNotFromUserUnitError()
  }
  const price = service.price
  const relation = { connect: { id: serviceId } }
  return { service, price, relation }
}

async function loadProduct(
  productId: string,
  quantity: number,
  repo: ProductRepository,
  userUnitId?: string,
  productsToUpdate?: { id: string; quantity: number }[],
) {
  const product = await repo.findById(productId)
  if (!product) throw new ProductNotFoundError()
  if (userUnitId && product.unitId !== userUnitId) {
    throw new ServiceNotFromUserUnitError()
  }
  if (typeof product.quantity === 'number' && product.quantity < quantity) {
    throw new InsufficientStockError()
  }
  if (productsToUpdate) {
    productsToUpdate.push({ id: productId, quantity })
  }
  const relation = { connect: { id: productId } }
  const price = product.price
  return { product, price, relation }
}

async function loadAppointment(
  appointmentId: string,
  repo: AppointmentRepository,
  userUnitId?: string,
) {
  const appointment = await repo.findById(appointmentId)
  if (!appointment) throw new AppointmentNotFoundError()
  if (appointment.saleItem) throw new AppointmentAlreadyLinkedError()
  if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW') {
    throw new InvalidAppointmentStatusError()
  }
  if (userUnitId && appointment.unitId !== userUnitId) {
    throw new ServiceNotFromUserUnitError()
  }
  const total = appointment.services.reduce(
    (acc, s) => acc + (s.service.price ?? 0),
    0,
  )
  const relation = { connect: { id: appointmentId } }
  return { appointment, price: total, relation, barberId: appointment.barberId }
}

async function loadPlan(planId: string, repo: PlanRepository) {
  const plan = await repo.findById(planId)
  if (!plan) throw new Error('Plan not found')
  const relation = { connect: { id: planId } }
  const price = plan.price
  return { plan, price, relation }
}

async function ensureBarberPermissions(
  barberId: string | undefined,
  barberRepo: BarberUsersRepository | undefined,
  service?: Service | null,
  product?: Product | null,
  appointment?: DetailedAppointment | null,
  userUnitId?: string,
) {
  if (!barberId || !barberRepo) return
  const barber = await barberRepo.findById(barberId)
  if (!barber) throw new BarberNotFoundError()
  if (!barber.profile) throw new ProfileNotFoundError()
  if (userUnitId && barber.unitId !== userUnitId) {
    throw new BarberNotFromUserUnitError()
  }
  const perms = barber.profile.permissions?.map((p) => p.name) ?? []
  if (service) {
    if (!hasPermission([PermissionName.SELL_SERVICE], perms)) {
      throw new BarberCannotSellItemError(barber.name, service.name)
    }
  } else if (product) {
    if (!hasPermission([PermissionName.SELL_PRODUCT], perms)) {
      throw new BarberCannotSellItemError(barber.name, product.name)
    }
  } else if (appointment) {
    if (!hasPermission([PermissionName.ACCEPT_APPOINTMENT], perms)) {
      throw new BarberCannotSellItemError(
        barber.name,
        `Appointment: ${appointment.date}`,
      )
    }
  }
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
  planRepository,
  enforceSingleType = true,
}: BuildItemDataOptions): Promise<TempItems> {
  ensureSingleType(item, enforceSingleType)

  const dataItem: DataItem = { quantity: item.quantity, categoryId: null }
  let basePrice = 0
  let service: Service | null = null
  let product: Product | null = null
  let appointment: DetailedAppointment | null = null
  let barberId: string | undefined = item.barberId

  if (item.serviceId) {
    const loaded = await loadService(
      item.serviceId,
      serviceRepository,
      userUnitId,
    )
    service = loaded.service
    basePrice = loaded.price * item.quantity
    dataItem.service = loaded.relation
    dataItem.categoryId = loaded.service.categoryId
  } else if (item.productId) {
    const loaded = await loadProduct(
      item.productId,
      item.quantity,
      productRepository,
      userUnitId,
      productsToUpdate,
    )
    product = loaded.product
    basePrice = loaded.price * item.quantity
    dataItem.product = loaded.relation
    dataItem.categoryId = loaded.product.categoryId
  } else if (item.appointmentId) {
    const loaded = await loadAppointment(
      item.appointmentId,
      appointmentRepository,
      userUnitId,
    )
    appointment = loaded.appointment
    basePrice = loaded.price
    dataItem.appointment = loaded.relation
    barberId = barberId ?? loaded.barberId
  } else if (item.planId && planRepository) {
    const loaded = await loadPlan(item.planId, planRepository)
    basePrice = loaded.price
    dataItem.plan = loaded.relation
  }

  await ensureBarberPermissions(
    barberId,
    barberUserRepository,
    service,
    product,
    appointment,
    userUnitId,
  )

  const result = await applyCouponToSale(
    item,
    basePrice,
    basePrice,
    0,
    null,
    false,
    couponRepository,
    userUnitId,
    undefined,
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
