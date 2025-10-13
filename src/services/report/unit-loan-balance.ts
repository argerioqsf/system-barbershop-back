import { TransactionRepository } from '@/repositories/transaction-repository'

interface UnitLoanBalanceRequest {
  unitId: string
}

interface UnitLoanBalanceResponse {
  borrowed: number
  paid: number
}

export class UnitLoanBalanceService {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute({
    unitId,
  }: UnitLoanBalanceRequest): Promise<UnitLoanBalanceResponse> {
    const transactions = await this.transactionRepository.findMany({
      unitId,
      affectedUserId: {
        equals: null,
      },
      isLoan: true,
    })

    const { borrowed, paid } = transactions.items.reduce(
      (totals, tx) => {
        if (tx.amount < 0) totals.borrowed += Math.abs(tx.amount)
        else totals.paid += tx.amount
        return totals
      },
      { borrowed: 0, paid: 0 },
    )

    return { borrowed, paid }
  }
}
