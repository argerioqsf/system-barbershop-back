import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'

interface ListUserLoansResponse {
  pending: LoanWithTransactions[]
  paid: LoanWithTransactions[]
  totalOwed: number
}

export class ListUserLoansService {
  constructor(private loanRepository: LoanRepository) {}

  async execute({
    userId,
  }: {
    userId: string
  }): Promise<ListUserLoansResponse> {
    const loans = await this.loanRepository.findMany({ userId })
    const paid: LoanWithTransactions[] = []
    const pending: LoanWithTransactions[] = []
    let totalOwed = 0

    for (const loan of loans) {
      const paidAmount = loan.transactions.reduce(
        (sum, tx) => (tx.amount > 0 ? sum + tx.amount : sum),
        0,
      )
      const remaining = loan.amount - paidAmount
      if (remaining > 0) {
        totalOwed += remaining
        pending.push(loan)
      } else {
        paid.push(loan)
      }
    }

    return { pending, paid, totalOwed }
  }
}
