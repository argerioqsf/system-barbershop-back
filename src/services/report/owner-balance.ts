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
  nameService: string
  quantity: number
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
      valueOwner: number,
      nameService: string,
      quantity: number,
      coupon?: string,
    ) {
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueOwner,
          coupon,
          nameService,
          quantity,
        })
      }
    }

    const salesTotal = sales.reduce((acc, sale) => {
      const totals = sale.items.reduce(
        (t, item) => {
          let value = item.price
          let percentageOwner = 100

          if (item.service.isProduct) t.product += value
          else {
            const barberPorcent =
              item.barber?.profile?.commissionPercentage ?? 100
            const valueBarber = (item.price * barberPorcent) / 100
            percentageOwner = 100 - barberPorcent
            value -= valueBarber
            t.service += value
          }

          setHistory(
            item.price,
            percentageOwner,
            value,
            item.service.name,
            item.quantity,
            item.coupon?.code ?? sale.coupon?.code ?? undefined,
          )

          t.total += value
          return t
        },
        { service: 0, product: 0, total: 0 },
      )

      return acc + (totals.service + totals.product)
    }, 0)

    const transactions = await this.transactionRepository.findMany({
      unit: { organizationId: orgId },
    })
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => {
        setHistory(t.amount, 100, t.amount, 'ADDITION', 1, undefined)
        return acc + t.amount
      }, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => {
        setHistory(t.amount * -1, 100, t.amount * -1, 'ADDITION', 1, undefined)
        return acc + t.amount
      }, 0)

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))
    return { balance, historySales }
  }
}
