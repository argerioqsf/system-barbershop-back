import { SaleRepository } from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { ProductRepository } from '../../repositories/product-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import { DiscountType, PaymentStatus, PermissionName } from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { distributeProfits } from './utils/profit-distribution'
import { CashRegisterClosedError } from '../@errors/cash-register/cash-register-closed-error'
import {
  CreateSaleItem,
  CreateSaleRequest,
  CreateSaleResponse,
  ConnectRelation,
  TempItems,
  SaleItemTemp,
} from './types'
import { applyCouponToItems } from './utils/coupon'
import { buildItemData } from './utils/item'
import { assertPermission } from '@/utils/permissions'
import {
  AppointmentRepository,
} from '@/repositories/appointment-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private appointmentRepository: AppointmentRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private saleItemRepository: SaleItemRepository,
  ) {}


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
      const temp = await buildItemData({
        item,
        serviceRepository: this.serviceRepository,
        productRepository: this.productRepository,
        appointmentRepository: this.appointmentRepository,
        couponRepository: this.couponRepository,
        userUnitId: user?.unitId as string,
        productsToUpdate,
        barberUserRepository: this.barberUserRepository,
        enforceSingleType: true,
      })
      tempItems.push(temp)
    }

    let couponConnect: ConnectRelation | undefined
    if (couponCode) {
      couponConnect = await applyCouponToItems(
        tempItems,
        couponCode,
        this.couponRepository,
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
          barberProductRepository: this.barberProductRepository,
          appointmentServiceRepository: this.appointmentServiceRepository,
          saleItemRepository: this.saleItemRepository,
        },
      )

      sale.transactions = [...transactions]

      for (const item of sale.items) {
        if (item.appointmentId) {
          await this.appointmentRepository.update(item.appointmentId, {
            status: 'CONCLUDED',
          })
        }
      }
    }

    await this.updateProductsStock(productsToUpdate)

    return { sale }
  }
}
