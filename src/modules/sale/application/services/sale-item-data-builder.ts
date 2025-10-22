import {
  Appointment,
  PermissionName,
  Plan,
  Product,
  Service,
} from '@prisma/client'

import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/modules/sale/application/ports/appointment-repository'
import { BarberUsersRepository } from '@/modules/sale/application/ports/barber-users-repository'
import { CouponRepository } from '@/modules/sale/application/ports/coupon-repository'
import { PlanRepository } from '@/modules/sale/application/ports/plan-repository'
import { PlanProfileRepository } from '@/modules/sale/application/ports/plan-profile-repository'
import { ProductRepository } from '@/modules/sale/application/ports/product-repository'
import { SaleRepository } from '@/modules/sale/application/ports/sale-repository'
import { ServiceRepository } from '@/modules/sale/application/ports/service-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
  SaleItemWithDiscounts,
} from '@/modules/sale/application/dto/sale-item-dto'
import { ItemNeedsServiceOrProductOrAppointmentError } from '@/services/@errors/sale/item-needs-service-or-product-error'
import { ServiceNotFoundError } from '@/services/@errors/service/service-not-found-error'
import { ServiceNotFromUserUnitError } from '@/services/@errors/service/service-not-from-user-unit-error'
import { ProductNotFoundError } from '@/services/@errors/product/product-not-found-error'
import { AppointmentNotFoundError } from '@/services/@errors/appointment/appointment-not-found-error'
import { InvalidAppointmentStatusError } from '@/services/@errors/appointment/invalid-appointment-status-error'
import { BarberNotFoundError } from '@/services/@errors/barber/barber-not-found-error'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { BarberNotFromUserUnitError } from '@/services/@errors/barber/barber-not-from-user-unit-error'
import { BarberCannotSellItemError } from '@/services/@errors/barber/barber-cannot-sell-item'
import { PlanNotFromUserUnitError } from '@/services/@errors/plan/plan-not-from-user-unit-error'
import { hasPermission } from '@/utils/permissions'
import { CouponService } from '@/modules/sale/application/services/coupon-service'
import { PlanDiscountService } from '@/modules/sale/application/services/plan-discount-service'

export interface SaleItemDataBuilderDeps {
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  barberUserRepository: BarberUsersRepository
  planRepository: PlanRepository
  saleRepository: SaleRepository
  planProfileRepository: PlanProfileRepository
}

export interface BuildContext {
  userUnitId?: string
  productsToUpdate?: ProductToUpdate[]
}

export class SaleItemDataBuilder {
  private readonly couponService: CouponService
  private readonly planDiscountService: PlanDiscountService

  constructor(private readonly deps: SaleItemDataBuilderDeps) {
    this.couponService = new CouponService({
      couponRepository: deps.couponRepository,
    })
    this.planDiscountService = new PlanDiscountService({
      planRepository: deps.planRepository,
      planProfileRepository: deps.planProfileRepository,
    })
  }

  async build(
    saleItem: SaleItemBuildItem,
    { userUnitId, productsToUpdate }: BuildContext,
  ): Promise<ReturnBuildItemData> {
    this.ensureSingleType(saleItem)

    let basePrice = 0
    let service: Service | null = null
    let product: Product | null = null
    let plan: Plan | null = null
    let appointment: DetailedAppointment | null = null
    let barberId: string | undefined | null = saleItem.barberId

    if (saleItem.serviceId) {
      const loaded = await this.loadService(saleItem.serviceId, userUnitId)
      service = loaded.service
      basePrice = loaded.price * saleItem.quantity
    } else if (saleItem.productId) {
      const loaded = await this.loadProduct(
        saleItem.productId,
        saleItem.quantity,
        saleItem.id,
        userUnitId,
        productsToUpdate,
      )
      product = loaded.product
      basePrice = loaded.price * saleItem.quantity
    } else if (saleItem.appointmentId) {
      const loaded = await this.loadAppointment(
        saleItem.appointmentId,
        userUnitId,
      )
      appointment = loaded.appointment
      basePrice = loaded.price
      barberId = barberId ?? loaded.barberId
    } else if (saleItem.planId) {
      const loaded = await this.loadPlan(saleItem.planId, userUnitId)
      plan = loaded.plan
      basePrice = loaded.price
    }

    const barber = barberId
      ? await this.ensureBarber(
          barberId,
          service,
          product,
          appointment,
          userUnitId,
        )
      : null

    const saleItemForDiscounts: ReturnBuildItemData = {
      id: saleItem.id,
      quantity: saleItem.quantity,
      service,
      product,
      plan,
      barber,
      price: basePrice,
      basePrice,
      customPrice: saleItem.customPrice ?? undefined,
      discounts: [],
      appointment: appointment as Appointment | null,
      coupon: null,
      commissionPaid: false,
    }

    const sale = await this.deps.saleRepository.findById(saleItem.saleId)
    if (!sale) throw new Error('Sale not found')

    const saleItemsWithPlan = await this.planDiscountService.apply(
      [saleItemForDiscounts],
      sale.clientId,
      sale.unitId,
    )

    const saleItemWithPlan: SaleItemWithDiscounts = {
      ...saleItemsWithPlan[0],
      saleId: saleItem.saleId,
      couponId: saleItem.couponId,
      customPrice: saleItem.customPrice,
    }

    const couponResult = await this.couponService.applyToItem({
      saleItem: saleItemWithPlan,
      basePrice,
      userUnitId,
    })

    return {
      ...saleItemWithPlan,
      coupon: couponResult.coupon,
      price: couponResult.price,
      basePrice,
      discounts: couponResult.discounts,
      commissionPaid: false,
    }
  }

  private ensureSingleType(item: SaleItemBuildItem): void {
    const count =
      (item.serviceId ? 1 : 0) +
      (item.productId ? 1 : 0) +
      (item.appointmentId ? 1 : 0) +
      (item.planId ? 1 : 0)
    if (count === 0 || count !== 1) {
      throw new ItemNeedsServiceOrProductOrAppointmentError()
    }
  }

  private async loadService(
    serviceId: string,
    userUnitId?: string,
  ): Promise<{ service: Service; price: number }> {
    const service = await this.deps.serviceRepository.findById(serviceId)
    if (!service) throw new ServiceNotFoundError()
    if (userUnitId && service.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    return { service, price: service.price }
  }

  private async loadProduct(
    productId: string,
    quantity: number,
    saleItemId?: string,
    userUnitId?: string,
    productsToUpdate?: ProductToUpdate[],
  ): Promise<{ product: Product; price: number }> {
    const product = await this.deps.productRepository.findById(productId)
    if (!product) throw new ProductNotFoundError()
    if (userUnitId && product.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    if (productsToUpdate) {
      productsToUpdate.push({
        id: productId,
        quantity,
        saleItemId: saleItemId ?? 'noHaveId',
      })
    }
    return { product, price: product.price }
  }

  private async loadAppointment(
    appointmentId: string,
    userUnitId?: string,
  ): Promise<{
    appointment: DetailedAppointment
    price: number
    barberId: string | null | undefined
  }> {
    const appointment = await this.deps.appointmentRepository.findById(
      appointmentId,
    )
    if (!appointment) throw new AppointmentNotFoundError()
    if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW') {
      throw new InvalidAppointmentStatusError()
    }
    if (userUnitId && appointment.unitId !== userUnitId) {
      throw new ServiceNotFromUserUnitError()
    }
    const total = appointment.services.reduce(
      (acc, service) => acc + (service.service.price ?? 0),
      0,
    )
    return { appointment, price: total, barberId: appointment.barberId }
  }

  private async loadPlan(
    planId: string,
    userUnitId?: string,
  ): Promise<{ plan: Plan; price: number }> {
    const plan = await this.deps.planRepository.findById(planId)
    if (!plan) throw new Error('Plan not found')
    if (userUnitId && plan.unitId !== userUnitId) {
      throw new PlanNotFromUserUnitError()
    }
    return { plan, price: plan.price }
  }

  private async ensureBarber(
    barberId: string,
    service: Service | null,
    product: Product | null,
    appointment: DetailedAppointment | null,
    userUnitId?: string,
  ) {
    const barber = await this.deps.barberUserRepository.findById(barberId)
    if (!barber) throw new BarberNotFoundError()
    if (userUnitId && barber.unitId !== userUnitId) {
      throw new BarberNotFromUserUnitError()
    }
    if (!barber.profile) throw new ProfileNotFoundError()
    const permissions = barber.profile.permissions?.map((p) => p.name) ?? []

    if (service) {
      if (!hasPermission([PermissionName.SELL_SERVICE], permissions)) {
        throw new BarberCannotSellItemError(barber.name, service.name)
      }
    } else if (product) {
      if (!hasPermission([PermissionName.SELL_PRODUCT], permissions)) {
        throw new BarberCannotSellItemError(barber.name, product.name)
      }
    } else if (appointment) {
      if (!hasPermission([PermissionName.ACCEPT_APPOINTMENT], permissions)) {
        throw new BarberCannotSellItemError(
          barber.name,
          `Appointment: ${appointment.date}`,
        )
      }
    }

    return barber
  }
}
