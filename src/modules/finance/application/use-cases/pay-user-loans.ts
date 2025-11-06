import { Money } from '@/core/domain/value-objects/money'
import { LoansRepositoryPort } from '@/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { Transaction } from '@prisma/client'
import { UserFindById } from '@/repositories/barber-users-repository'
import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { settleLoanPayment } from '@/modules/finance/application/services/loan-payment-service'

export interface PayUserLoansCommand {
  affectedUser: NonNullable<UserFindById>
  amount: Money
  tx?: TransactionClient
}

export interface PayUserLoansResult {
  transactions: Transaction[]
  totalPaid: Money
  remaining: Money
}

export class PayUserLoansUseCase {
  constructor(
    private readonly loansRepository: LoansRepositoryPort,
    private readonly incrementBalanceUnitService: IncrementBalanceUnitService,
  ) {}

  async execute(command: PayUserLoansCommand): Promise<PayUserLoansResult> {
    const loans = await this.loansRepository.findMany(
      {
        userId: command.affectedUser.id,
        status: LoanStatus.VALUE_TRANSFERRED,
      },
      command.tx,
    )

    loans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    let remaining = command.amount
    let totalPaid = Money.zero()
    const transactions: Transaction[] = []

    for (const loan of loans) {
      if (!remaining.isPositive()) break

      const payment = await settleLoanPayment({
        loan,
        amount: remaining,
        payerUserId: command.affectedUser.id,
        incrementBalanceUnitService: this.incrementBalanceUnitService,
        loansRepository: this.loansRepository,
        tx: command.tx,
      })

      if (payment.paid.isPositive() && payment.transaction) {
        transactions.push(payment.transaction)
        totalPaid = totalPaid.add(payment.paid)
        remaining = remaining.subtract(payment.paid).clampZero()
      }
    }

    return {
      transactions,
      totalPaid,
      remaining: remaining.clampZero(),
    }
  }
}
