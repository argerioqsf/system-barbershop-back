import { DetailedSale, SaleRepository } from '@/repositories/sale-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'

interface OwnerBalanceRequest {
  ownerId: string
}

interface HistorySales {
  valueService: number
  percentage: number
  valueOwner: number
  coupon?: string
  saleItems: {
    quantity: number
    name: string
    price: number
    userEmail: string
  }[]
}

interface OwnerBalanceResponse {
  balance: number
  historySales: HistorySales[]
}

export class OwnerBalanceService {
  constructor(
    private saleRepository: SaleRepository,
    private transactionRepository: TransactionRepository,
    private userRepository: BarberUsersRepository,
  ) {}

  async execute({
    ownerId,
  }: OwnerBalanceRequest): Promise<OwnerBalanceResponse> {
    const owner = await this.userRepository.findById(ownerId)
    if (!owner) throw new Error('Owner not found')
    const orgId = owner.organizationId
    const sales = await this.saleRepository.findMany({
      unit: { organizationId: orgId },
    })
    const historySales: HistorySales[] = []

    function setHistory(
      valueService: number,
      percentage: number,
      valuePorcent: number,
      sale: DetailedSale,
    ) {
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueOwner: valuePorcent,
          coupon: sale.coupon?.code,
          saleItems: sale.items.map((item) => ({
            quantity: item.quantity,
            name: item.service.name,
            price: item.service.price,
            userEmail: sale.user.name,
          })),
        })
      }
    }

    const salesTotal = sales.reduce((acc, sale) => {
      const totals = sale.items.reduce(
        (t, item) => {
          const value = item.service.price * item.quantity
          if (item.service.isProduct) t.product += value
          else t.service += value
          t.total += value
          return t
        },
        { service: 0, product: 0, total: 0 },
      )

      let serviceShare = totals.service
      let productShare = totals.product

      if (sale.coupon) {
        if (sale.coupon.discountType === 'PERCENTAGE') {
          serviceShare -= (serviceShare * sale.coupon.discount) / 100
          productShare -= (productShare * sale.coupon.discount) / 100
        } else {
          const totalBefore = totals.service + totals.product
          const serviceDiscount =
            (totals.service / totalBefore) * sale.coupon.discount
          const productDiscount =
            (totals.product / totalBefore) * sale.coupon.discount
          serviceShare -= serviceDiscount
          productShare -= productDiscount
        }
      }

      let ownerShare = productShare
      let totalServiceAfterDiscount = 0
      for (const item of sale.items) {
        let value = item.service.price * item.quantity
        if (sale.coupon) {
          if (sale.coupon.discountType === 'PERCENTAGE') {
            value -= (value * sale.coupon.discount) / 100
          } else {
            const proportion =
              value / (totals.service + totals.product)
            value -= proportion * sale.coupon.discount
          }
        }
        if (item.service.isProduct) {
          ownerShare += value
        } else {
          totalServiceAfterDiscount += value
          const perc = item.barber?.profile?.commissionPercentage ?? 100
          const barberShare = value * (perc / 100)
          ownerShare += value - barberShare
        }
      }
      const ownerPercentage =
        totalServiceAfterDiscount > 0
          ? (ownerShare - productShare) / totalServiceAfterDiscount * 100
          : 0
      setHistory(serviceShare, ownerPercentage, ownerShare, sale)
      return acc + ownerShare
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(ownerId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))
    return { balance, historySales }
  }
}
