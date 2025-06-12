import {
  SaleRepository,
  DetailedSale,
} from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import { PaymentMethod, SaleItem, TransactionType } from '@prisma/client'
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
    const tempItems: { price: number; ownDiscount: boolean; data: any }[] = []
    const user = await this.barberUserRepository.findById(userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session) throw new Error('Cash register closed')
    for (const item of items) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      let price = service.price * item.quantity
      let itemCouponConnect: any
      let ownDiscount = false
      if (typeof item.price === 'number') {
        price = item.price
        ownDiscount = true
      } else if (item.couponCode) {
        const coupon = await this.couponRepository.findByCode(item.couponCode)
        if (!coupon) throw new Error('Coupon not found')
        if (coupon.quantity <= 0) throw new Error('Coupon exhausted')
        const discountAmount =
          coupon.discountType === 'PERCENTAGE'
            ? (price * coupon.discount) / 100
            : coupon.discount
        price = Math.max(price - discountAmount, 0)
        itemCouponConnect = { connect: { id: coupon.id } }
        await this.couponRepository.update(coupon.id, {
          quantity: { decrement: 1 },
        })
        ownDiscount = true
      }

      tempItems.push({
        price,
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
          temp.price = Math.max(
            temp.price - (temp.price * coupon.discount) / 100,
            0,
          )
        } else if (affectedTotal > 0) {
          const part = (temp.price / affectedTotal) * coupon.discount
          temp.price = Math.max(temp.price - part, 0)
        }
      }

      couponConnect = { connect: { id: coupon.id } }
      await this.couponRepository.update(coupon.id, {
        quantity: { decrement: 1 },
      })
    }

    for (const temp of tempItems) {
      saleItems.push({ ...temp.data, price: temp.price })
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
