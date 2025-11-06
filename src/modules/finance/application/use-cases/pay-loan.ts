import { Money } from '@/core/domain/value-objects/money'
import { LoansRepositoryPort } from '@/modules/finance/application/ports/loans-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { LoanPaymentGreaterThanRemainingError } from '@/services/@errors/loan/loan-payment-greater-than-remaining-error'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import {
  calculateLoanOutstanding,
  settleLoanPayment,
} from '@/modules/finance/application/services/loan-payment-service'
import { PayLoanDTO, PayLoanOutput } from '../dto/pay-loan.dto'
import { LoanPaymentTransactionError } from '../errors/loan-payment-transaction-error'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { LoanNotFoundError } from '../errors/loan-not-found-error'
import { NegativeValuesNotAllowedError } from '../errors/negative-values-not-allowed-error'

export class PayLoanUseCase {
  constructor(
    private readonly loansRepository: LoansRepositoryPort,
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly incrementBalanceProfile: IncrementBalanceProfileService,
    private readonly incrementBalanceUnit: IncrementBalanceUnitService,
  ) {}

  async execute(command: PayLoanDTO): Promise<PayLoanOutput> {
    if (!command.amount.isPositive()) {
      throw new NegativeValuesNotAllowedError()
    }

    const loan = await this.loansRepository.findById(command.loanId)
    if (!loan) {
      throw new LoanNotFoundError()
    }

    const affectedUser = await this.barberUsersRepository.findById(loan.userId)
    if (!affectedUser || !affectedUser.profile) {
      throw new UserNotFoundError()
    }

    const { outstanding } = calculateLoanOutstanding(loan)

    if (!outstanding.isPositive() || command.amount.greaterThan(outstanding)) {
      throw new LoanPaymentGreaterThanRemainingError()
    }

    const userBalance = Money.from(affectedUser.profile.totalBalance ?? 0)
    if (command.amount.greaterThan(userBalance)) {
      throw new InsufficientBalanceError()
    }

    const profileTx = await this.incrementBalanceProfile.execute(
      affectedUser.id,
      command.amount.multiply(-1).toNumber(),
      { reason: TransactionReason.PAY_LOAN, userId: command.actorId },
      undefined,
      true,
      'Pay loan',
      undefined,
      undefined,
      loan.id,
    )

    const payment = await settleLoanPayment({
      loan,
      amount: command.amount,
      payerUserId: affectedUser.id,
      incrementBalanceUnitService: this.incrementBalanceUnit,
      loansRepository: this.loansRepository,
    })

    const unitTransaction = payment.transaction
    if (!unitTransaction) {
      throw new LoanPaymentTransactionError()
    }

    return {
      transactions: [profileTx.transaction, unitTransaction],
      remaining: payment.remaining,
    }
  }
}
