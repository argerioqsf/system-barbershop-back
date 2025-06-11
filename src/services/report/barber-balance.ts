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
      if (itemsTotals.total > 0) {
        const diff = sale.total - itemsTotals.total
        serviceShare += diff * (itemsTotals.service / itemsTotals.total)
      }

      return acc + serviceShare
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(barberId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = salesTotal + additions - withdrawals

    return { balance }
  }
}
