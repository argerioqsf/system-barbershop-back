import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import {
  Service,
  Product,
  PermissionName,
  Coupon,
  Plan,
  Appointment,
  Prisma,
} from '@prisma/client'
import { PlanRepository } from '@/repositories/plan-repository'
import { CreateSaleItem } from '../types'
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
import { applyCouponSaleItem, NewDiscount } from './coupon'
import { SaleItemRepository } from '@/repositories/sale-item-repository'

export interface BuildItemDataOptions {
  saleItem: CreateSaleItem
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  planRepository?: PlanRepository
  userUnitId?: string
  productsToUpdate?: { id: string; quantity: number }[]
  barberUserRepository: BarberUsersRepository
  enforceSingleType?: boolean
}

export function ensureSingleType(item: {
  serviceId?: string | null
  productId?: string | null
  appointmentId?: string | null
  planId?: string | null
}) {
  const count =
    (item.serviceId ? 1 : 0) +
    (item.productId ? 1 : 0) +
    (item.appointmentId ? 1 : 0) +
    (item.planId ? 1 : 0)
  if (count === 0 || count !== 1) {
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
  return { service, price }
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
  const price = product.price
  return { product, price }
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
  return { appointment, price: total, barberId: appointment.barberId }
}

async function loadPlan(planId: string, repo: PlanRepository) {
  const plan = await repo.findById(planId)
  if (!plan) throw new Error('Plan not found')
  const price = plan.price
  return { plan, price }
}

async function ensureBarberPermissions(
  barber: NonNullable<UserFindById>,
  service?: Service | null,
  product?: Product | null,
  appointment?: DetailedAppointment | null,
  userUnitId?: string,
) {
  if (userUnitId && barber.unitId !== userUnitId) {
    throw new BarberNotFromUserUnitError()
  }
  if (!barber.profile) throw new ProfileNotFoundError()
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

export type ReturnBuildItemData = {
  id?: string
  coupon?: Coupon | null
  quantity: number
  service?: Service | null
  product?: Product | null
  plan?: Plan | null
  barber?: UserFindById | null
  price: number
  customPrice?: number | null
  discounts: NewDiscount[]
  appointment?: Appointment | null
  commissionPaid: boolean
}
export async function buildItemData({
  saleItem,
  serviceRepository,
  productRepository,
  appointmentRepository,
  couponRepository,
  userUnitId,
  productsToUpdate,
  barberUserRepository,
  planRepository,
}: BuildItemDataOptions): Promise<ReturnBuildItemData> {
  ensureSingleType({
    serviceId: saleItem.serviceId,
    productId: saleItem.productId,
    appointmentId: saleItem.appointmentId,
    planId: saleItem.planId,
  })

  let basePrice = 0
  let service: Service | null = null
  let product: Product | null = null
  let plan: Plan | null = null
  let barber: UserFindById | null = null
  let appointment: DetailedAppointment | null = null
  let barberId: string | undefined | null = saleItem.barberId
  const quantity = saleItem.quantity

  if (saleItem.serviceId) {
    const serviceLoaded = await loadService(
      saleItem.serviceId,
      serviceRepository,
      userUnitId,
    )
    service = serviceLoaded.service
    basePrice = serviceLoaded.price * saleItem.quantity
  } else if (saleItem.productId) {
    const productLoaded = await loadProduct(
      saleItem.productId,
      saleItem.quantity,
      productRepository,
      userUnitId,
      productsToUpdate,
    )
    product = productLoaded.product
    basePrice = productLoaded.price * saleItem.quantity
  } else if (saleItem.appointmentId) {
    const AppointmentLoaded = await loadAppointment(
      saleItem.appointmentId,
      appointmentRepository,
      userUnitId,
    )
    appointment = AppointmentLoaded.appointment
    basePrice = AppointmentLoaded.price
    barberId = barberId ?? AppointmentLoaded.barberId
  } else if (saleItem.planId && planRepository) {
    const PlanLoaded = await loadPlan(saleItem.planId, planRepository)
    plan = PlanLoaded.plan
    basePrice = PlanLoaded.price
  }

  if (barberId) {
    barber = await barberUserRepository.findById(barberId)
    if (!barber) throw new BarberNotFoundError()
    await ensureBarberPermissions(
      barber,
      service,
      product,
      appointment,
      userUnitId,
    )
  }

  const { coupon, price, discounts } = await applyCouponSaleItem({
    saleItem,
    basePrice,
    discount: 0,
    discountType: null,
    ownDiscount: false,
    couponRepository,
    userUnitId,
  })

  return {
    id: saleItem.id,
    coupon,
    quantity,
    service,
    product,
    plan,
    barber,
    price,
    customPrice: saleItem.customPrice,
    discounts,
    appointment,
    commissionPaid: false,
  }
}

export async function updateDiscountsOnSaleItem(
  saleItem: ReturnBuildItemData,
  saleItemId: string,
  saleItemRepository: SaleItemRepository,
  tx: Prisma.TransactionClient,
) {
  const newDiscounts = saleItem.discounts
  await saleItemRepository.update(
    saleItemId,
    {
      price: saleItem.price,
      ...(newDiscounts
        ? {
            discounts: {
              deleteMany: {},
              create: saleItem.discounts.map((d) => ({
                amount: d.amount,
                type: d.type,
                origin: d.origin,
                order: d.order,
              })),
            },
          }
        : {}),
    },
    tx,
  )
}
