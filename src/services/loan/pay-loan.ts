import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { NegativeValuesNotAllowedError } from '../@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '../@errors/transaction/insufficient-balance-error'
import { LoanPaymentGreaterThanRemainingError } from '../@errors/loan/loan-payment-greater-than-remaining-error'
import { LoanStatus, Transaction } from '@prisma/client'

interface PayLoanRequest {
  loanId: string
  amount: number
}

interface PayLoanResponse {
  transactions: Transaction[]
  remaining: number
}

export class PayLoanService {
  constructor(
    private loanRepository: LoanRepository,
    private profileRepository: ProfilesRepository,
    private barberUsersRepository: BarberUsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  private getPaidAmount(loan: LoanWithTransactions) {
    return loan.transactions.reduce(
      (s, t) => (t.amount > 0 ? s + t.amount : s),
      0,
    )
  }

  async execute({ loanId, amount }: PayLoanRequest): Promise<PayLoanResponse> {
    if (amount <= 0) throw new NegativeValuesNotAllowedError()

    const loan = await this.loanRepository.findById(loanId)
    if (!loan) throw new Error('Loan not found')

    const user = await this.barberUsersRepository.findById(loan.userId)
    if (!user || !user.profile) throw new Error('User not found')

    const paidAmount = this.getPaidAmount(loan)
    const remainingLoan = loan.amount - paidAmount

    if (remainingLoan <= 0 || amount > remainingLoan) {
      throw new LoanPaymentGreaterThanRemainingError()
    }

    if (amount > user.profile.totalBalance) throw new InsufficientBalanceError()

    const decProfile = new IncrementBalanceProfileService(
      this.profileRepository,
    )
    const incUnit = new IncrementBalanceUnitService(this.unitRepository)

    const txProfile = await decProfile.execute(
      user.id,
      -amount,
      undefined,
      true,
      'Pay loan',
      undefined,
      undefined,
      loan.id,
    )
    const txUnit = await incUnit.execute(
      loan.unitId,
      user.id,
      amount,
      undefined,
      true,
      loan.id,
    )

    const newPaid = paidAmount + amount
    const fully = newPaid >= loan.amount
    if (fully) {
      await this.loanRepository.update(loan.id, {
        fullyPaid: true,
        paidAt: new Date(),
        status: LoanStatus.PAID,
      })
    }

    return {
      transactions: [txProfile.transaction, txUnit.transaction],
      remaining: remainingLoan - amount,
    }
  }
}
