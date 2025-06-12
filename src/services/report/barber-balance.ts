import { TransactionFull } from '@/repositories/prisma/prisma-transaction-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'

interface BarberBalanceRequest {
  barberId: string
}

interface HistorySales {
  valueService: number
  percentage: number
  valueBarber: number
  coupon?: string
  nameService: string
}

interface BarberBalanceResponse {
  balance: number
  historySales: HistorySales[]
}

export class BarberBalanceService {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute({
    barberId,
  }: BarberBalanceRequest): Promise<BarberBalanceResponse> {
    const historySales: HistorySales[] = []

    function setHistory(
      valueService: number,
      percentage: number,
      valueBarber: number,
      nameService: string,
      coupon?: string,
    ) {
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueBarber,
          coupon,
          nameService,
        })
      }
    }

    function saleTotal(sale: TransactionFull['sale']) {
      if (!sale) return 0
      const items = sale.items.filter((i) => i.barberId === barberId)
      const percentage = sale.user.profile?.commissionPercentage ?? 100

      const serviceShare = items.reduce((totals, item) => {
        if (!item.service.isProduct) {
          const valueBarber = ((item.price ?? 0) * percentage) / 100
          setHistory(
            item.price ?? 0,
            percentage,
            valueBarber,
            item.service.name,
            item.coupon?.code ?? sale.coupon?.code ?? undefined,
          )
          totals += valueBarber
        }
        return totals
      }, 0)
      return serviceShare
    }

    const transactions = await this.transactionRepository.findMany({
      sale: { items: { some: { barberId } } },
    })

    const { additions, withdrawals } = transactions.reduce(
      (totals, transaction) => {
        if (transaction.type === 'ADDITION') {
          const totalSale = saleTotal(transaction.sale)
          totals.additions += totalSale
        }
        if (transaction.type === 'WITHDRAWAL') {
          setHistory(
            transaction.amount * -1,
            100,
            transaction.amount * -1,
            'WITHDRAWAL',
            undefined,
          )
          totals.withdrawals += transaction.amount
        }
        return totals
      },
      { additions: 0, withdrawals: 0 },
    )

    const balance = Number((additions - withdrawals).toFixed(2))

    return { balance, historySales }
  }
}
