import {
  SaleRepository,
  DetailedSale,
} from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import {
  DiscountType,
  PaymentMethod,
  SaleItem,
  TransactionType,
} from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'

interface CreateSaleItem {
  serviceId: string
  quantity: number
  barberId?: string
  couponCode?: string
  price?: number
}

interface CreateSaleRequest {
  userId: string
  method: PaymentMethod
  items: CreateSaleItem[]
  couponCode?: string
}

interface CreateSaleResponse {
  sale: DetailedSale
}

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({
    userId,
    method,
    items,
    couponCode,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const saleItems: SaleItem[] = []
    const tempItems: {
      basePrice: number
      price: number
      discount: number
      discountType?: DiscountType
      porcentagemBarbeiro?: number
      ownDiscount: boolean
      data: any
    }[] = []
    const user = await this.barberUserRepository.findById(userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session) throw new Error('Cash register closed')
    for (const item of items) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      const basePrice = service.price * item.quantity
      let price = basePrice
      let discount = 0
      let discountType: DiscountType | undefined
      let itemCouponConnect: any
      let ownDiscount = false
      let porcentagemBarbeiro: number | undefined

      if (item.barberId) {
        const barber = await this.barberUserRepository.findById(item.barberId)
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
          service: { connect: { id: item.serviceId } },
          quantity: item.quantity,
          barber: item.barberId
            ? { connect: { id: item.barberId } }
            : undefined,
          coupon: itemCouponConnect,
        },
      })
    }

    let couponConnect: any
    if (couponCode) {
      const coupon = await this.couponRepository.findByCode(couponCode)
      if (!coupon) throw new Error('Coupon not found')
      if (coupon.quantity <= 0) throw new Error('Coupon exhausted')

      const affectedTotal = tempItems
        .filter((i) => !i.ownDiscount)
        .reduce((acc, i) => acc + i.price, 0)

      for (const temp of tempItems) {
        if (temp.ownDiscount) continue
        if (coupon.discountType === 'PERCENTAGE') {
          const reduction = (temp.price * coupon.discount) / 100
          temp.price = Math.max(temp.price - reduction, 0)
          temp.discount = coupon.discount
        } else if (affectedTotal > 0) {
          const part = (temp.price / affectedTotal) * coupon.discount
          temp.price = Math.max(temp.price - part, 0)
          temp.discount = coupon.discount
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
        porcentagemBarbeiro: temp.porcentagemBarbeiro,
      })
    }

    const calculatedTotal = tempItems.reduce((acc, i) => acc + i.price, 0)

    const transaction = await this.transactionRepository.create({
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      session: { connect: { id: session.id } },
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount: calculatedTotal,
    })

    try {
      const sale = await this.saleRepository.create({
        total: calculatedTotal,
        method,
        user: { connect: { id: userId } },
        client: { connect: { id: clientId } },
        unit: { connect: { id: user?.unitId } },
        session: { connect: { id: session.id } },
        items: { create: saleItems },
        coupon: couponConnect,
        transaction: { connect: { id: transaction.id } },
      })

      return { sale }
    } catch (error) {
      await this.transactionRepository.delete(transaction.id)
      throw error
    }
  }
}
