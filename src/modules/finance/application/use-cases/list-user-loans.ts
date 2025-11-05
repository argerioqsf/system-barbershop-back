import { LoansRepositoryPort } from '@/modules/finance/application/ports/loans-repository'
import { Money } from '@/core/domain/value-objects/money'
import { ListUserLoansDTO, UserLoansSummary } from '../dto/list-user-loans.dto'

export class ListUserLoansUseCase {
  constructor(private readonly loansRepository: LoansRepositoryPort) {}

  async execute(userId: ListUserLoansDTO): Promise<UserLoansSummary> {
    const loans = await this.loansRepository.findMany({ userId })

    const pending: UserLoansSummary['pending'] = []
    const paid: UserLoansSummary['paid'] = []

    let totalOwed = Money.zero()

    for (const loan of loans) {
      const paidAmount = loan.transactions.reduce(
        (total, transaction) => total.add(transaction.amount),
        Money.zero(),
      )

      const remaining = loan.amount.subtract(paidAmount)

      if (remaining.isPositive()) {
        totalOwed = totalOwed.add(remaining)
        pending.push({
          id: loan.id,
          amount: loan.amount,
          remaining,
          createdAt: loan.createdAt,
        })
      } else {
        paid.push({
          id: loan.id,
          amount: loan.amount,
          paidAt: loan.paidAt ?? new Date(),
        })
      }
    }

    return {
      pending,
      paid,
      totalOwed,
    }
  }
}
