import {
  SaleRepository,
  DetailedSale,
} from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { ProductRepository } from '../../repositories/product-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import {
  DiscountType,
  PaymentMethod,
  SaleItem,
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

interface CreateSaleItem {
  serviceId?: string
  productId?: string
  quantity: number
  barberId?: string
  couponCode?: string
  price?: number
}

interface CreateSaleRequest {
  userId: string
  method: PaymentMethod
  items: CreateSaleItem[]
  clientId: string
  couponCode?: string
  paymentStatus?: PaymentStatus
}

interface CreateSaleResponse {
  sale: DetailedSale
}

interface ConnectRelation {
  connect: { id: string }
}

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

  async execute({
    userId,
    method,
    items,
    clientId,
    couponCode,
    paymentStatus = PaymentStatus.PENDING,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const saleItems: SaleItem[] = []
    let couponConnect: ConnectRelation | undefined
    const tempItems: {
      basePrice: number
      price: number
      discount: number
      discountType: DiscountType | null
      porcentagemBarbeiro?: number
      ownDiscount: boolean
      data: any
    }[] = []
    const user = await this.barberUserRepository.findById(userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session && paymentStatus === PaymentStatus.PAID)
      throw new Error('Cash register closed')
    const productsToUpdate: { id: string; quantity: number }[] = []
    for (const item of items) {
      if ((item.serviceId ? 1 : 0) + (item.productId ? 1 : 0) !== 1) {
        throw new Error('Item must have serviceId or productId')
      }
      let basePrice = 0
      const dataItem: any = { quantity: item.quantity }
      if (item.serviceId) {
        const service = await this.serviceRepository.findById(item.serviceId)
        if (!service) throw new Error('Service not found')
        if (service.unitId !== user?.unitId) {
          throw new ServiceNotFromUserUnitError()
        }
        basePrice = service.price * item.quantity
        dataItem.service = { connect: { id: item.serviceId } }
      } else if (item.productId) {
        const product = await this.productRepository.findById(item.productId)
        if (!product) throw new Error('Product not found')
        if (product.unitId !== user?.unitId) {
          throw new ServiceNotFromUserUnitError()
        }
        if (product.quantity < item.quantity)
          throw new Error('Insufficient stock')
        basePrice = product.price * item.quantity
        dataItem.product = { connect: { id: item.productId } }
        productsToUpdate.push({ id: item.productId, quantity: item.quantity })
      }
      let price = basePrice
      let discount = 0
      let discountType: DiscountType | null = null
      let itemCouponConnect: { connect: { id: string } } | undefined
      let ownDiscount = false
      let porcentagemBarbeiro: number | undefined

      if (item.barberId) {
        const barber = await this.barberUserRepository.findById(item.barberId)
        if (barber && barber.unitId !== user?.unitId) {
          throw new BarberNotFromUserUnitError()
        }
        porcentagemBarbeiro = barber?.profile?.commissionPercentage
      }

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
        if (coupon.unitId !== user?.unitId) {
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
        itemCouponConnect = { connect: { id: coupon.id } }
        await this.couponRepository.update(coupon.id, {
          quantity: { decrement: 1 },
        })
        ownDiscount = true
      }

      tempItems.push({
        basePrice,
        price,
        discount,
        discountType,
        porcentagemBarbeiro,
        ownDiscount,
        data: {
          ...dataItem,
          barber: item.barberId
            ? { connect: { id: item.barberId } }
            : undefined,
          coupon: itemCouponConnect,
        },
      })
    }

    if (couponCode) {
      const affectedTotal = tempItems
        .filter((i) => !i.ownDiscount)
        .reduce((acc, i) => acc + i.price, 0)

      const coupon = await this.couponRepository.findByCode(couponCode)
      if (!coupon) throw new Error('Coupon not found')
      if (coupon.unitId !== user?.unitId) {
        throw new CouponNotFromUserUnitError()
      }
      if (coupon.quantity <= 0) throw new Error('Coupon exhausted')

      for (const temp of tempItems) {
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

      couponConnect = { connect: { id: coupon.id } }
      await this.couponRepository.update(coupon.id, {
        quantity: { decrement: 1 },
      })
    }

    for (const temp of tempItems) {
      saleItems.push({
        ...temp.data,
        price: temp.price,
        discount: temp.discount,
        discountType: temp.discountType,
        porcentagemBarbeiro: temp.porcentagemBarbeiro ?? null,
      })
    }

    const calculatedTotal = tempItems.reduce((acc, i) => acc + i.price, 0)

    let transaction: Transaction | null = null
    if (paymentStatus === PaymentStatus.PAID) {
      transaction = await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id: user?.unitId } },
        session: { connect: { id: session!.id } },
        type: TransactionType.ADDITION,
        description: 'Sale',
        amount: calculatedTotal,
      })
    }

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
        const org = await this.organizationRepository.findById(
          user?.organizationId as string,
        )
        if (!org) throw new Error('Org not found')
        const barberTotals: Record<string, number> = {}
        let ownerShare = 0
        for (const item of sale.items) {
          const value = item.price ?? 0
          if (item.product) {
            ownerShare += value
          } else if (item.barberId) {
            const perc = item.porcentagemBarbeiro ?? 100
            const valueBarber = (value * perc) / 100
            barberTotals[item.barberId] =
              (barberTotals[item.barberId] || 0) + valueBarber
            ownerShare += value - valueBarber
          } else {
            ownerShare += value
          }
        }
        for (const [barberId, amount] of Object.entries(barberTotals)) {
          const userBarber = sale.items.find(
            (item) => item.barber?.id === barberId,
          )
          if (!userBarber) throw new Error('Barber not found')
          if (
            userBarber &&
            userBarber.barber &&
            userBarber.barber.profile &&
            userBarber.barber.profile.totalBalance < 0
          ) {
            const balanceBarber = userBarber.barber.profile.totalBalance
            const valueCalculated = balanceBarber + amount
            if (valueCalculated <= 0) {
              await this.unitRepository.incrementBalance(sale.unitId, amount)
            } else {
              await this.unitRepository.incrementBalance(
                sale.unitId,
                balanceBarber * -1,
              )
              await this.organizationRepository.incrementBalance(
                org.id,
                balanceBarber * -1,
              )
            }
          }
          await this.profileRepository.incrementBalance(barberId, amount)
        }
        await this.unitRepository.incrementBalance(sale.unitId, ownerShare)
        await this.organizationRepository.incrementBalance(org.id, ownerShare)
      }
      for (const prod of productsToUpdate) {
        await this.productRepository.update(prod.id, {
          quantity: { decrement: prod.quantity },
        })
      }

      return { sale }
    } catch (error) {
      if (transaction) await this.transactionRepository.delete(transaction.id)
      throw error
    }
  }
}
