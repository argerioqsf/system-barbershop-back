import {
  SaleRepository,
  DetailedSale,
} from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { ProductRepository } from '../../repositories/product-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import {
  DiscountType,
  TransactionType,
  PaymentStatus,
  Transaction,
} from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ServiceNotFromUserUnitError } from '../@errors/service-not-from-user-unit-error'
import { BarberNotFromUserUnitError } from '../@errors/barber-not-from-user-unit-error'
import { CouponNotFromUserUnitError } from '../@errors/coupon-not-from-user-unit-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { distributeProfits } from './profit-distribution'
import {
  CreateSaleItem,
  CreateSaleRequest,
  CreateSaleResponse,
  ConnectRelation,
  DataItem,
  TempItems,
  SaleItemTemp,
} from './types'

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
  ) {}

  private async buildItemData(
    item: CreateSaleItem,
    userUnitId: string,
    productsToUpdate: { id: string; quantity: number }[],
  ): Promise<TempItems> {
    if ((item.serviceId ? 1 : 0) + (item.productId ? 1 : 0) !== 1) {
      throw new Error('Item must have serviceId or productId')
    }

    let basePrice = 0
    const dataItem: DataItem = {
      quantity: item.quantity,
    }

    if (item.serviceId) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      if (service.unitId !== userUnitId) {
        throw new ServiceNotFromUserUnitError()
      }
      basePrice = service.price * item.quantity
      dataItem.service = { connect: { id: item.serviceId } }
    } else if (item.productId) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) throw new Error('Product not found')
      if (product.unitId !== userUnitId) {
        throw new ServiceNotFromUserUnitError()
      }
      if (product.quantity < item.quantity)
        throw new Error('Insufficient stock')
      basePrice = product.price * item.quantity
      dataItem.product = { connect: { id: item.productId } }
      productsToUpdate.push({ id: item.productId, quantity: item.quantity })
    }

    const price = basePrice
    const discount = 0
    const discountType: DiscountType | null = null
    let couponRel: { connect: { id: string } } | undefined
    const ownDiscount = false
    let barberCommission: number | undefined

    if (item.barberId) {
      const barber = await this.barberUserRepository.findById(item.barberId)
      if (barber && barber.unitId !== userUnitId) {
        throw new BarberNotFromUserUnitError()
      }
      barberCommission = barber?.profile?.commissionPercentage
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
        barber: item.barberId ? { connect: { id: item.barberId } } : undefined,
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
      }
    } else if (item.couponCode) {
      const coupon = await this.couponRepository.findByCode(item.couponCode)
      if (!coupon) throw new Error('Coupon not found')
      if (coupon.unitId !== userUnitId) {
        throw new CouponNotFromUserUnitError()
      }
      if (coupon.quantity <= 0) throw new Error('Coupon exhausted')
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
    if (!coupon) throw new Error('Coupon not found')
    if (coupon.unitId !== userUnitId) {
      throw new CouponNotFromUserUnitError()
    }
    if (coupon.quantity <= 0) throw new Error('Coupon exhausted')

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
      porcentagemBarbeiro: temp.porcentagemBarbeiro ?? null,
    }))
  }

  private calculateTotal(tempItems: TempItems[]): number {
    return tempItems.reduce((acc, i) => acc + i.price, 0)
  }

  private async createTransactionIfPaid(
    paymentStatus: PaymentStatus,
    userId: string,
    unitId: string | undefined,
    session: { id: string } | null,
    amount: number,
  ): Promise<Transaction | null> {
    if (paymentStatus !== PaymentStatus.PAID) return null

    return this.transactionRepository.create({
      user: { connect: { id: userId } },
      unit: { connect: { id: unitId } },
      session: session ? { connect: { id: session.id } } : undefined,
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount,
    })
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
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const tempItems: TempItems[] = []
    const productsToUpdate: { id: string; quantity: number }[] = []

    const user = await this.barberUserRepository.findById(userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )

    if (!session && paymentStatus === PaymentStatus.PAID)
      throw new Error('Cash register closed')

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

    const transaction = await this.createTransactionIfPaid(
      paymentStatus,
      userId,
      user?.unitId,
      session,
      calculatedTotal,
    )

    try {
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
        transaction: transaction
          ? { connect: { id: transaction.id } }
          : undefined,
      })

      if (paymentStatus === PaymentStatus.PAID) {
        await distributeProfits(sale, user?.organizationId as string, {
          organizationRepository: this.organizationRepository,
          profileRepository: this.profileRepository,
          unitRepository: this.unitRepository,
        })
      }

      await this.updateProductsStock(productsToUpdate)

      return { sale }
    } catch (error) {
      if (transaction) await this.transactionRepository.delete(transaction.id)
      throw error
    }
  }
}
