import { BarberUsersRepository } from '@/repositories/barber-users-repository'
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
  constructor(
    private transactionRepository: TransactionRepository,
    private userRepository: BarberUsersRepository,
  ) {}

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
      historySales.push({
        valueService,
        percentage,
        valueBarber,
        coupon,
        nameService,
      })
    }

    function saleTotal(sale: TransactionFull['sale']) {
      if (!sale) return 0
      const items = sale.items.filter((i) => i.barberId === barberId)

      const serviceShare = items.reduce((totals, item) => {
        if (!item.productId) {
          const percentage = item.porcentagemBarbeiro ?? 0
          const valueBarber = ((item.price ?? 0) * percentage) / 100
          setHistory(
            item.price ?? 0,
            percentage,
            valueBarber,
            item.service?.name ?? '',
            item.coupon?.code ?? sale.coupon?.code ?? undefined,
          )
          totals += valueBarber
        }
        return totals
      }, 0)
      return serviceShare
    }

    const barber = await this.userRepository.findById(barberId)
    const transactionsSales = await this.transactionRepository.findMany({
      sale: { items: { some: { barberId } } },
      unit: { organizationId: barber?.unit?.organizationId },
    })
    const transactionsBarber = await this.transactionRepository.findManyByUser(
      barberId,
    )
    const transactions = Array.from(
      new Map(
        [...transactionsSales, ...transactionsBarber].map((tx) => [tx.id, tx]),
      ).values(),
    )

    const { additions, withdrawals } = transactions.reduce(
      (totals, transaction) => {
        if (transaction.type === 'ADDITION') {
          if (transaction.sale) {
            const totalSale = saleTotal(transaction.sale)
            totals.additions += totalSale
          } else {
            setHistory(
              transaction.amount,
              100,
              transaction.amount,
              'ADDITION',
              undefined,
            )
            totals.additions += transaction.amount
          }
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
