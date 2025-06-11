import { SaleRepository, DetailedSale } from '../../repositories/sale-repository'
import { ServiceRepository } from '../../repositories/service-repository'
import { CouponRepository } from '../../repositories/coupon-repository'
import { PaymentMethod } from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'

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
      const discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (total * coupon.discount) / 100
          : coupon.discount
      total = Math.max(total - discountAmount, 0)
      couponConnect = { connect: { id: coupon.id } }
    }

    const sale = await this.saleRepository.create({
      total,
      method,
      user: { connect: { id: userId } },
      unit: { connect: { id: user?.unitId } },
      items: { create: saleItems },
      coupon: couponConnect,
    })

    return { sale }
  }
}
