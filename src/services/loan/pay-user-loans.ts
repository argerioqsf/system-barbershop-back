import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { LoanStatus, Prisma, Transaction } from '@prisma/client'
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

  async execute(
    { affectedUser, amount }: PayUserLoansRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserLoansResponse> {
    const loans = await this.loanRepository.findMany(
      {
        userId: affectedUser.id,
        status: { equals: LoanStatus.PAID },
        fullyPaid: { equals: false },
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
            fullyPaid: true,
            paidAt: new Date(),
            status: LoanStatus.PAID,
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
        tx,
      )
      transactions.push(txUnit.transaction)
      totalPaid += toPay
      remaining -= toPay

      const fully = amountPaidForTransactions + toPay >= loan.amount
      if (fully) {
        await this.loanRepository.update(
          loan.id,
          {
            fullyPaid: fully,
            paidAt: new Date(),
            status: LoanStatus.PAID,
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
