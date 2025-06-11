import { SaleRepository } from '@/repositories/sale-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'

interface BarberBalanceRequest {
  barberId: string
}

interface BarberBalanceResponse {
  balance: number
}

export class BarberBalanceService {
  constructor(
    private saleRepository: SaleRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({
    barberId,
  }: BarberBalanceRequest): Promise<BarberBalanceResponse> {
    const sales = await this.saleRepository.findManyByUser(barberId)
    const salesTotal = sales.reduce((acc, sale) => {
      const itemsTotals = sale.items.reduce(
        (totals, item) => {
          const value = item.service.price * item.quantity
          if (item.service.isProduct) {
            totals.product += value
          } else {
            totals.service += value
          }
          totals.total += value
          return totals
        },
        { service: 0, product: 0, total: 0 },
      )

      let serviceShare = itemsTotals.service
      let productShare = itemsTotals.product

      if (sale.coupon && serviceShare > 0) {
        if (sale.coupon.discountType === 'PERCENTAGE') {
          serviceShare =
            serviceShare - (serviceShare * sale.coupon.discount) / 100
          productShare =
            productShare - (productShare * sale.coupon.discount) / 100
        } else {
          serviceShare = serviceShare - sale.coupon.discount
          productShare = productShare - sale.coupon.discount
        }
      }
      const total = serviceShare + productShare
      if (total !== sale.total) {
        if (productShare > 0) {
          let porcentService = (100 * serviceShare) / total
          if (sale.coupon) {
            porcentService =
              (100 * itemsTotals.service) /
              (itemsTotals.service + itemsTotals.product)
          }
          const totalRelative = (sale.total * porcentService) / 100
          return acc + Number(totalRelative.toFixed(2))
        } else {
          return acc + Number(sale.total.toFixed(2))
        }
      }
      return acc + Number(serviceShare.toFixed(2))
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(barberId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))

    return { balance }
  }
}
