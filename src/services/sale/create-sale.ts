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

    for (const item of items) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      const subtotal = service.price * item.quantity
      calculatedTotal += subtotal
      saleItems.push({
        service: { connect: { id: item.serviceId } },
        quantity: item.quantity,
      })
    }

    if (typeof total !== 'number') total = calculatedTotal

    let couponConnect: any
    if (couponCode) {
      const coupon = await this.couponRepository.findByCode(couponCode)
      if (!coupon) throw new Error('Coupon not found')
      if (coupon.quantity <= 0) throw new Error('Coupon exhausted')
      const discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (total * coupon.discount) / 100
          : coupon.discount
      total = Math.max(total - discountAmount, 0)
      couponConnect = { connect: { id: coupon.id } }
      await this.couponRepository.update(coupon.id, {
        quantity: { decrement: 1 },
      })
    }

    const sale = await this.saleRepository.create({
      total,
      method,
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      session: { connect: { id: session.id } },
      items: { create: saleItems },
      coupon: couponConnect,
    })

    await this.transactionRepository.create({
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      cashRegisterSession: { connect: { id: session.id } },
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount: total,
    })

    return { sale }
  }
}
