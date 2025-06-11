import {
  SaleRepository,
  DetailedSale,
} from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import {
  PaymentMethod,
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
  total?: number
}

interface CreateSaleRequest {
  userId: string
  method: PaymentMethod
  items: CreateSaleItem[]
  couponCode?: string
  total?: number
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
    total,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    let calculatedTotal = 0
    const saleItems = [] as any[]
    const user = await this.barberUserRepository.findById(userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session) throw new Error('Cash register closed')

    const useItemAdjustments = !couponCode && typeof total !== 'number'

    for (const item of items) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      let itemTotal = service.price * item.quantity
      let itemCouponConnect: any

      if (useItemAdjustments) {
        if (typeof item.total === 'number') {
          itemTotal = item.total
        } else if (item.couponCode) {
          const coupon = await this.couponRepository.findByCode(item.couponCode)
          if (!coupon) throw new Error('Coupon not found')
          if (coupon.quantity <= 0) throw new Error('Coupon exhausted')
          const discount =
            coupon.discountType === 'PERCENTAGE'
              ? (itemTotal * coupon.discount) / 100
              : coupon.discount
          itemTotal = Math.max(itemTotal - discount, 0)
          itemCouponConnect = { connect: { id: coupon.id } }
          await this.couponRepository.update(coupon.id, {
            quantity: { decrement: 1 },
          })
        }
      }

      calculatedTotal += itemTotal
      saleItems.push({
        service: { connect: { id: item.serviceId } },
        quantity: item.quantity,
        barber: item.barberId ? { connect: { id: item.barberId } } : undefined,
        coupon: itemCouponConnect,
        total: itemTotal,
      })
    }

    let couponConnect: any
    let finalTotal = calculatedTotal
    if (typeof total === 'number') {
      finalTotal = total
    } else if (couponCode) {
      const coupon = await this.couponRepository.findByCode(couponCode)
      if (!coupon) throw new Error('Coupon not found')
      if (coupon.quantity <= 0) throw new Error('Coupon exhausted')
      const discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (finalTotal * coupon.discount) / 100
          : coupon.discount
      finalTotal = Math.max(finalTotal - discountAmount, 0)
      couponConnect = { connect: { id: coupon.id } }
      await this.couponRepository.update(coupon.id, {
        quantity: { decrement: 1 },
      })
    }

    const sale = await this.saleRepository.create({
      total: finalTotal,
      method,
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      session: { connect: { id: session.id } },
      items: { create: saleItems },
      coupon: couponConnect,
    })

    const transaction = await this.transactionRepository.create({
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      session: { connect: { id: session.id } },
      sale: { connect: { id: sale.id } },
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount: finalTotal,
    })

    await this.saleRepository.update(sale.id, {
      transaction: { connect: { id: transaction.id } },
    })

    const updatedSale = await this.saleRepository.findById(sale.id)
    return { sale: updatedSale as DetailedSale }
  }
}
