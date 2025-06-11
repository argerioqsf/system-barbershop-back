import { DetailedSale, SaleRepository } from '@/repositories/sale-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'

interface BarberBalanceRequest {
  barberId: string
}

interface HistorySales {
  valueService: number
  percentage: number
  valueBarber: number
  coupon?: string
  saleItems: {
    quantity: number
    name: string
    price: number
    userEmail: string
  }[]
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
      valuePorcent: number,
      sale: DetailedSale,
    ) {
      if (valueService > 0) {
        historySales.push({
          valueService,
          percentage,
          valueBarber: valuePorcent,
          coupon: sale.coupon?.code,
          saleItems: sale.items
            .filter((i) => i.barberId === barberId)
            .map((item) => ({
              quantity: item.quantity,
              name: item.service.name,
              price: item.service.price,
              userEmail: sale.user.name,
            })),
        })
      }
    }

    const salesTotal = sales.reduce((acc, sale) => {
      const items = sale.items.filter((i) => i.barberId === barberId)
      const { service: rawService, product: rawProduct } = items.reduce(
        (totals, item) => {
          const value = item.service.price * item.quantity
          item.service.isProduct
            ? (totals.product += value)
            : (totals.service += value)
          return totals
        },
        { service: 0, product: 0 },
      )

      let serviceShare = rawService
      let productShare = rawProduct

      if (sale.coupon && serviceShare > 0) {
        const { discountType, discount } = sale.coupon
        if (discountType === 'PERCENTAGE') {
          serviceShare -= (serviceShare * discount) / 100
          productShare -= (productShare * discount) / 100
        } else {
          serviceShare -= discount
          productShare -= discount
        }
      }

      const percentage =
        items[0]?.barber?.profile?.commissionPercentage ?? 100
      const valueService = Number(serviceShare.toFixed(2))
      const valuePorcent = (valueService * percentage) / 100
      setHistory(valueService, percentage, valuePorcent, sale)
      return acc + valuePorcent
    }, 0)

    const { additions, withdrawals } = (
      await this.transactionRepository.findManyByUser(barberId)
    ).reduce(
      (totals, t) => {
        if (t.type === 'ADDITION') totals.additions += t.amount
        else if (t.type === 'WITHDRAWAL') totals.withdrawals += t.amount
        return totals
      },
      { additions: 0, withdrawals: 0 },
    )

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))

    return { balance, historySales }
  }
}
