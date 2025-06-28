import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { UpdateSaleRequest, TempItems } from './types'
import { PaymentStatus } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { CashRegisterClosedError } from '../@errors/cash-register/cash-register-closed-error'
import { applyCouponToItems } from './utils/coupon'
import { buildItemData } from './utils/item'
import { distributeProfits } from './utils/profit-distribution'
import {
  mapToSaleItems,
  calculateTotal,
  updateProductsStock,
} from './utils/sale'

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
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private saleItemRepository: SaleItemRepository,
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

    const user = await this.barberUserRepository.findById(current.userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session && paymentStatus === PaymentStatus.PAID)
      throw new CashRegisterClosedError()

    const tempItems: TempItems[] = []
    const productsToUpdate: { id: string; quantity: number }[] = []
    const productsToRestore: { id: string; quantity: number }[] = []
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
          productsToUpdate,
        })
        tempItems.push(built)
        if (it.appointmentId) appointmentsToLink.push(it.appointmentId)
      }
    }

    let subtractTotal = 0
    if (removeItemIds) {
      for (const idToRemove of removeItemIds) {
        const found = current.items.find((i) => i.id === idToRemove)
        if (found) {
          subtractTotal += found.price
          if (found.productId) {
            productsToRestore.push({
              id: found.productId,
              quantity: found.quantity,
            })
          }
        }
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

    const total = current.total + calculateTotal(tempItems) - subtractTotal

    const saleItems = mapToSaleItems(tempItems)

    const sale = await this.repository.update(id, {
      observation,
      method,
      paymentStatus,
      total,
      session:
        paymentStatus === PaymentStatus.PAID && session
          ? { connect: { id: session.id } }
          : undefined,
      items: {
        create: saleItems,
        deleteMany: removeItemIds?.map((rid) => ({ id: rid })),
      },
      coupon: couponConnect,
    })

    for (const item of sale.items) {
      if (item.appointmentId) {
        const paid = sale.paymentStatus === PaymentStatus.PAID
        const newAppointment = appointmentsToLink.includes(item.appointmentId)

        await this.appointmentRepository.update(item.appointmentId, {
          ...(newAppointment ? { saleItem: { connect: { id: item.id } } } : {}),
          ...(paid ? { status: 'CONCLUDED' } : {}),
        })
      }
    }

    if (paymentStatus === PaymentStatus.PAID) {
      const { transactions } = await distributeProfits(
        sale,
        user?.organizationId as string,
        current.userId,
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
    }

    await updateProductsStock(this.productRepository, productsToUpdate)
    await updateProductsStock(
      this.productRepository,
      productsToRestore,
      'increment',
    )

    return { sale }
  }
}
