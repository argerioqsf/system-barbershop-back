import { SaleRepository } from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { ProductRepository } from '../../repositories/product-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import {
  DiscountType,
  PaymentStatus,
  Product,
  Service,
  PermissionName,
  BarberService,
  BarberProduct,
} from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ServiceNotFromUserUnitError } from '../@errors/service/service-not-from-user-unit-error'
import { BarberNotFromUserUnitError } from '../@errors/barber/barber-not-from-user-unit-error'
import { CouponNotFromUserUnitError } from '../@errors/coupon/coupon-not-from-user-unit-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { distributeProfits } from './utils/profit-distribution'
import { calculateBarberCommission } from './utils/barber-commission'
import { ItemNeedsServiceOrProductOrAppointmentError } from '../@errors/sale/item-needs-service-or-product-error'
import { ServiceNotFoundError } from '../@errors/service/service-not-found-error'
import { ProductNotFoundError } from '../@errors/product/product-not-found-error'
import { InsufficientStockError } from '../@errors/product/insufficient-stock-error'
import { CouponNotFoundError } from '../@errors/coupon/coupon-not-found-error'
import { CouponExhaustedError } from '../@errors/coupon/coupon-exhausted-error'
import { CashRegisterClosedError } from '../@errors/cash-register/cash-register-closed-error'
import {
  CreateSaleItem,
  CreateSaleRequest,
  CreateSaleResponse,
  ConnectRelation,
  DataItem,
  TempItems,
  SaleItemTemp,
} from './types'
import { BarberNotFoundError } from '../@errors/barber/barber-not-found-error'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import { assertPermission } from '@/utils/permissions'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'
import { AppointmentAlreadyLinkedError } from '../@errors/appointment/appointment-already-linked-error'
import { AppointmentNotFoundError } from '../@errors/appointment/appointment-not-found-error'
import { ItemPriceGreaterError } from '../@errors/sale/Item-price-greater-error'
import { InvalidAppointmentStatusError } from '../@errors/appointment/invalid-appointment-status-error'

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: import('@/repositories/barber-service-repository').BarberServiceRepository,
    private barberProductRepository: import('@/repositories/barber-product-repository').BarberProductRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  private async buildItemData(
    item: CreateSaleItem,
    userUnitId: string,
    productsToUpdate: { id: string; quantity: number }[],
  ): Promise<TempItems> {
    if (
      (item.serviceId ? 1 : 0) +
        (item.productId ? 1 : 0) +
        (item.appointmentId ? 1 : 0) !==
      1
    ) {
      throw new ItemNeedsServiceOrProductOrAppointmentError()
    }

    let basePrice = 0
    const dataItem: DataItem = {
      quantity: item.quantity,
    }

    let service: Service | null = null
    let product: Product | null = null
    let appointment: DetailedAppointment | null = null
    let barberId: string | undefined = item.barberId

    if (item.serviceId) {
      service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new ServiceNotFoundError()
      if (service.unitId !== userUnitId) {
        throw new ServiceNotFromUserUnitError()
      }
      basePrice = service.price * item.quantity
      dataItem.service = { connect: { id: item.serviceId } }
    } else if (item.productId) {
      product = await this.productRepository.findById(item.productId)
      if (!product) throw new ProductNotFoundError()
      if (product.unitId !== userUnitId) {
        throw new ServiceNotFromUserUnitError()
      }
      if (product.quantity < item.quantity) throw new InsufficientStockError()
      basePrice = product.price * item.quantity
      dataItem.product = { connect: { id: item.productId } }
      productsToUpdate.push({ id: item.productId, quantity: item.quantity })
    } else if (item.appointmentId) {
      appointment = await this.appointmentRepository.findById(
        item.appointmentId,
      )
      if (appointment?.saleItem) throw new AppointmentAlreadyLinkedError()
      if (!appointment) throw new AppointmentNotFoundError()
      if (appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW')
        throw new InvalidAppointmentStatusError()
      if (appointment.unitId !== userUnitId) {
        throw new ServiceNotFromUserUnitError()
      }
      const appointmentTotal = appointment.services.reduce((acc, s) => {
        const service = s.service ?? s
        return acc + (service.price ?? 0)
      }, 0)
      basePrice = appointmentTotal
      dataItem.appointment = { connect: { id: item.appointmentId } }
      barberId = barberId ?? appointment.barberId
    }

    const price = basePrice
    const discount = 0
    const discountType: DiscountType | null = null
    let couponRel: { connect: { id: string } } | undefined
    const ownDiscount = false
    let barberCommission: number | undefined
    let relation: BarberService | BarberProduct | null | undefined = null
    let selectedItem: Service | Product | null = null

    if (barberId) {
      const barber = await this.barberUserRepository.findById(barberId)
      if (!barber) throw new BarberNotFoundError()
      if (!barber.profile) throw new ProfileNotFoundError()
      if (barber && barber.unitId !== userUnitId) {
        throw new BarberNotFromUserUnitError()
      }

      if (service) {
        await assertPermission(
          [PermissionName.SELL_SERVICE],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
        relation = await this.barberServiceRepository.findByProfileService(
          barber.profile.id,
          service.id,
        )
        selectedItem = service
      } else if (product) {
        await assertPermission(
          [PermissionName.SELL_PRODUCT],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
        relation = await this.barberProductRepository.findByProfileProduct(
          barber.profile.id,
          product.id,
        )
        selectedItem = product
      } else if (appointment) {
        await assertPermission(
          [PermissionName.SELL_APPOINTMENT],
          barber.profile.permissions?.map((p) => p.name) ?? [],
        )
      }
      if (selectedItem) {
        barberCommission = calculateBarberCommission(
          selectedItem,
          barber?.profile,
          relation,
        )
      }
    }

    const resultLogicSalesCoupons = await this.applyCouponToSale(
      item,
      price,
      basePrice,
      discount,
      discountType,
      ownDiscount,
      userUnitId,
      couponRel,
    )

    return {
      ...resultLogicSalesCoupons,
      basePrice,
      porcentagemBarbeiro: barberCommission,
      data: {
        ...dataItem,
        barber: barberId ? { connect: { id: barberId } } : undefined,
        coupon: resultLogicSalesCoupons.couponRel,
      },
    }
  }

  private async applyCouponToSale(
    item: CreateSaleItem,
    price: number,
    basePrice: number,
    discount: number,
    discountType: DiscountType | null,
    ownDiscount: boolean,
    userUnitId: string,
    couponRel: { connect: { id: string } } | undefined,
  ) {
    if (typeof item.price === 'number') {
      price = item.price
      if (basePrice - price > 0) {
        discount = basePrice - price
        discountType = DiscountType.VALUE
        ownDiscount = true
      } else {
        throw new ItemPriceGreaterError()
      }
    } else if (item.couponCode) {
      const coupon = await this.couponRepository.findByCode(item.couponCode)
      if (!coupon) throw new CouponNotFoundError()
      if (coupon.unitId !== userUnitId) {
        throw new CouponNotFromUserUnitError()
      }
      if (coupon.quantity <= 0) throw new CouponExhaustedError()
      const discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (price * coupon.discount) / 100
          : coupon.discount
      price = Math.max(price - discountAmount, 0)
      discount = coupon.discount
      discountType = coupon.discountType
      couponRel = { connect: { id: coupon.id } }
      await this.couponRepository.update(coupon.id, {
        quantity: { decrement: 1 },
      })
      ownDiscount = true
    }
    return {
      price,
      discount,
      discountType,
      ownDiscount,
      couponRel,
    }
  }

  private async applyCouponToItems(
    items: TempItems[],
    couponCode: string,
    userUnitId: string,
  ): Promise<ConnectRelation | undefined> {
    const affectedTotal = items
      .filter((i) => !i.ownDiscount)
      .reduce((acc, i) => acc + i.price, 0)
    const coupon = await this.couponRepository.findByCode(couponCode)
    if (!coupon) throw new CouponNotFoundError()
    if (coupon.unitId !== userUnitId) {
      throw new CouponNotFromUserUnitError()
    }
    if (coupon.quantity <= 0) throw new CouponExhaustedError()

    for (const temp of items) {
      if (temp.ownDiscount) continue
      if (coupon.discountType === 'PERCENTAGE') {
        const reduction = (temp.price * coupon.discount) / 100
        temp.price = Math.max(temp.price - reduction, 0)
        temp.discount = coupon.discount
      } else if (affectedTotal > 0) {
        const part = (temp.price / affectedTotal) * coupon.discount
        temp.price = Math.max(temp.price - part, 0)
        temp.discount = part
      }
      temp.discountType = coupon.discountType
    }

    await this.couponRepository.update(coupon.id, {
      quantity: { decrement: 1 },
    })

    return { connect: { id: coupon.id } }
  }

  private mapToSaleItems(tempItems: TempItems[]): SaleItemTemp[] {
    return tempItems.map((temp) => ({
      coupon: temp.data.coupon,
      quantity: temp.data.quantity,
      service: temp.data.service,
      product: temp.data.product,
      barber: temp.data.barber,
      price: temp.price,
      discount: temp.discount,
      discountType: temp.discountType,
      appointment: temp.data.appointment,
      porcentagemBarbeiro: temp.porcentagemBarbeiro ?? null,
    }))
  }

  private calculateTotal(tempItems: TempItems[]): number {
    return tempItems.reduce((acc, i) => acc + i.price, 0)
  }

  private async updateProductsStock(
    products: { id: string; quantity: number }[],
  ): Promise<void> {
    for (const prod of products) {
      await this.productRepository.update(prod.id, {
        quantity: { decrement: prod.quantity },
      })
    }
  }

  async execute({
    userId,
    method,
    items,
    clientId,
    couponCode,
    paymentStatus = PaymentStatus.PENDING,
    observation,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const tempItems: TempItems[] = []
    const productsToUpdate: { id: string; quantity: number }[] = []
    const user = await this.barberUserRepository.findById(userId)
    await assertPermission(
      [PermissionName.CREATE_SALE],
      user?.profile?.permissions?.map((p) => p.name),
    )
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )

    if (!session && paymentStatus === PaymentStatus.PAID)
      throw new CashRegisterClosedError()

    for (const item of items) {
      const temp = await this.buildItemData(
        item,
        user?.unitId as string,
        productsToUpdate,
      )
      tempItems.push(temp)
    }

    let couponConnect: ConnectRelation | undefined
    if (couponCode) {
      couponConnect = await this.applyCouponToItems(
        tempItems,
        couponCode,
        user?.unitId as string,
      )
    }

    const saleItems = this.mapToSaleItems(tempItems)
    const calculatedTotal = this.calculateTotal(tempItems)

    const sale = await this.saleRepository.create({
      total: calculatedTotal,
      method,
      paymentStatus,
      user: { connect: { id: userId } },
      client: { connect: { id: clientId } },
      unit: { connect: { id: user?.unitId } },
      session:
        paymentStatus === PaymentStatus.PAID && session
          ? { connect: { id: session.id } }
          : undefined,
      items: { create: saleItems },
      coupon: couponConnect,
      observation,
    })

    for (const item of sale.items) {
      if (item.appointmentId) {
        await this.appointmentRepository.update(item.appointmentId, {
          saleItem: { connect: { id: item.id } },
        })
      }
    }

    if (paymentStatus === PaymentStatus.PAID) {
      for (const item of sale.items) {
        if (item.appointmentId) {
          await this.appointmentRepository.update(item.appointmentId, {
            status: 'CONCLUDED',
          })
        }
      }
      const { transactions } = await distributeProfits(
        sale,
        user?.organizationId as string,
        userId,
        {
          organizationRepository: this.organizationRepository,
          profileRepository: this.profileRepository,
          unitRepository: this.unitRepository,
          transactionRepository: this.transactionRepository,
          appointmentRepository: this.appointmentRepository,
          barberServiceRepository: this.barberServiceRepository,
        },
      )
      sale.transactions = [...transactions]
    }

    await this.updateProductsStock(productsToUpdate)

    return { sale }
  }
}
