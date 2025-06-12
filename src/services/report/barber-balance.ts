import { SaleRepository } from '@/repositories/sale-repository'
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
  constructor(
    private saleRepository: SaleRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({
    barberId,
  }: BarberBalanceRequest): Promise<BarberBalanceResponse> {
    const sales = await this.saleRepository.findManyByBarber(barberId)
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

    const salesTotal = sales.reduce((acc, sale) => {
      const items = sale.items.filter((i) => i.barberId === barberId)
      const percentage = sale.user.profile?.commissionPercentage ?? 100

      const serviceShare = items.reduce((totals, item) => {
        if (!item.service.isProduct) {
          const valueBarber = (item.price * percentage) / 100
          setHistory(
            item.price,
            percentage,
            valueBarber,
            item.service.name,
            item.coupon?.code ?? sale.coupon?.code ?? undefined,
          )
          totals += valueBarber
        }
        return totals
      }, 0)
      return acc + serviceShare
    }, 0)
    const transactions =
      await this.transactionRepository.findManyByUser(barberId)
    const { additions, withdrawals } = transactions.reduce(
      (totals, t) => {
        if (t.type === 'ADDITION') {
          setHistory(t.amount, 100, t.amount, 'ADDITION', undefined)
          totals.additions += t.amount
        }
        if (t.type === 'WITHDRAWAL') {
          setHistory(t.amount * -1, 100, t.amount * -1, 'WITHDRAWAL', undefined)
          totals.withdrawals += t.amount
        }
        return totals
      },
      { additions: 0, withdrawals: 0 },
    )

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))

    return { balance, historySales }
  }
}
