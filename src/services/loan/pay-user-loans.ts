import { LoanRepository } from '@/repositories/loan-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { LoanStatus, Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { IncrementBalanceUnitService } from '../unit/increment-balance'

interface PayUserLoansRequest {
  userId: string
  amount: number
}

interface PayUserLoansResponse {
  transactions: Transaction[]
  remaining: number
}

export class PayUserLoansService {
  constructor(
    private loanRepository: LoanRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({
    userId,
    amount,
  }: PayUserLoansRequest): Promise<PayUserLoansResponse> {
    const loans = await this.loanRepository.findMany({
      userId,
      status: { equals: LoanStatus.APPROVED },
      fullyPaid: { equals: false },
    })
    loans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let remaining = amount
    const transactions: Transaction[] = []
    for (const loan of loans) {
      if (remaining <= 0) break
      const paid = loan.transactions.reduce(
        (s: number, t: Transaction) => (t.amount > 0 ? s + t.amount : s),
        0,
      )
      const toPay = Math.min(loan.amount - paid, remaining)
      if (toPay <= 0) {
        await this.loanRepository.update(loan.id, {
          fullyPaid: true,
          paidAt: new Date(),
          status: LoanStatus.PAID,
        })
        continue
      }
      const incProfile = new IncrementBalanceProfileService(
        this.profileRepository,
      )
      const incUnit = new IncrementBalanceUnitService(
        this.unitRepository,
        this.transactionRepository,
      )
      const txProfile = await incProfile.execute(
        userId,
        toPay,
        undefined,
        true,
        'Loan payment',
        undefined,
        undefined,
        loan.id,
      )
      const txUnit = await incUnit.execute(
        loan.unitId,
        userId,
        toPay,
        undefined,
        true,
        loan.id,
      )
      transactions.push(txProfile.transaction, txUnit.transaction)
      remaining -= toPay
      const fully = paid + toPay >= loan.amount
      await this.loanRepository.update(loan.id, {
        fullyPaid: fully,
        ...(fully ? { paidAt: new Date(), status: LoanStatus.PAID } : {}),
      })
    }
    return { transactions, remaining }
  }
}
