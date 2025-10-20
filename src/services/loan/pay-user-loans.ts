import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  LoanStatus,
  Prisma,
  ReasonTransaction,
  Transaction,
} from '@prisma/client'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { UserFindById } from '@/repositories/barber-users-repository'

interface PayUserLoansRequest {
  affectedUser: NonNullable<UserFindById>
  amount: number
}

interface PayUserLoansResponse {
  transactions: Transaction[]
  remaining: number
  totalPaid: number
}

export class PayUserLoansService {
  constructor(
    private loanRepository: LoanRepository,
    private unitRepository: UnitRepository,
  ) {}

  private getAmountPaidForTransactions(loan: LoanWithTransactions) {
    return loan.transactions.reduce(
      (s: number, t: Transaction) => (t.amount > 0 ? s + t.amount : s),
      0,
    )
  }

  // TODO: unificar logica de pagar emprestimos com o src/services/loan/pay-user-loans.ts
  // essa logica nao precisa retirar do balanco de usuario pq onde é chamada ja faz isso antes
  async execute(
    { affectedUser, amount }: PayUserLoansRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserLoansResponse> {
    const loans = await this.loanRepository.findMany(
      {
        userId: affectedUser.id,
        status: { equals: LoanStatus.VALUE_TRANSFERRED },
      },
      tx,
    )
    loans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const incUnit = new IncrementBalanceUnitService(this.unitRepository)

    let remaining = amount
    const transactions: Transaction[] = []
    let totalPaid = 0
    for (const loan of loans) {
      if (remaining <= 0) break
      const amountPaidForTransactions = this.getAmountPaidForTransactions(loan)
      const toPay = Math.min(loan.amount - amountPaidForTransactions, remaining)

      if (toPay <= 0) {
        await this.loanRepository.update(
          loan.id,
          {
            paidAt: new Date(),
            status: LoanStatus.PAID_OFF,
          },
          tx,
        )
        continue
      }

      const txUnit = await incUnit.execute(
        loan.unitId,
        affectedUser.id,
        toPay,
        undefined,
        true,
        loan.id,
        undefined,
        { reason: ReasonTransaction.PAY_LOAN, tx },
      )
      transactions.push(txUnit.transaction)
      totalPaid += toPay
      remaining -= toPay

      const fully = amountPaidForTransactions + toPay >= loan.amount
      if (fully) {
        await this.loanRepository.update(
          loan.id,
          {
            paidAt: new Date(),
            status: LoanStatus.PAID_OFF,
          },
          tx,
        )
      }
    }
    return {
      transactions,
      remaining: Math.floor(remaining * 100) / 100,
      totalPaid: Math.floor(totalPaid * 100) / 100,
    }
  }
}
