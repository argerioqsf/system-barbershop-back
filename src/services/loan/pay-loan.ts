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
import { LoanStatus, ReasonTransaction, Transaction } from '@prisma/client'
import { UserToken } from '@/http/controllers/authenticate-controller'

interface PayLoanRequest {
  loanId: string
  amount: number
  user: UserToken
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

  // TODO: unificar logica de pagar emprestimos com o src/services/loan/pay-loan.ts
  async execute({
    loanId,
    amount,
    user,
  }: PayLoanRequest): Promise<PayLoanResponse> {
    if (amount <= 0) throw new NegativeValuesNotAllowedError()

    const loan = await this.loanRepository.findById(loanId)
    if (!loan) throw new Error('Loan not found')

    const affectedUser = await this.barberUsersRepository.findById(loan.userId)
    if (!affectedUser || !affectedUser.profile)
      throw new Error('User not found')

    const paidAmount = this.getPaidAmount(loan)
    const remainingLoan = loan.amount - paidAmount

    if (remainingLoan <= 0 || amount > remainingLoan) {
      throw new LoanPaymentGreaterThanRemainingError()
    }

    if (amount > affectedUser.profile.totalBalance)
      throw new InsufficientBalanceError()

    const decProfile = new IncrementBalanceProfileService(
      this.profileRepository,
    )
    const incUnit = new IncrementBalanceUnitService(this.unitRepository)

    const txProfile = await decProfile.execute(
      affectedUser.id,
      -amount,
      undefined,
      true,
      'Pay loan',
      undefined,
      undefined,
      loan.id,
      { reason: ReasonTransaction.PAY_LOAN, userId: user.sub },
    )
    const txUnit = await incUnit.execute(
      loan.unitId,
      affectedUser.id,
      amount,
      undefined,
      true,
      loan.id,
      undefined,
      { reason: ReasonTransaction.PAY_LOAN },
    )

    const newPaid = paidAmount + amount
    const fully = newPaid >= loan.amount
    if (fully) {
      await this.loanRepository.update(loan.id, {
        paidAt: new Date(),
        status: LoanStatus.PAID_OFF,
      })
    }

    return {
      transactions: [txProfile.transaction, txUnit.transaction],
      remaining: remainingLoan - amount,
    }
  }
}
