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

  async execute({ barberId }: BarberBalanceRequest): Promise<BarberBalanceResponse> {
    const sales = await this.saleRepository.findManyByUser(barberId)
    const salesTotal = sales.reduce((acc, sale) => acc + sale.total, 0)

    const transactions = await this.transactionRepository.findManyByUser(barberId)
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
