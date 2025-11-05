import { Money } from '@/core/domain/value-objects/money'
import { TransactionClient } from '@/core/application/ports/transaction-runner'
import {
  LoansRepositoryPort,
  LoanWithTransactionsRecord,
} from '@/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { Transaction } from '@prisma/client'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'

export interface LoanOutstandingSnapshot {
  amountAlreadyPaid: Money
  outstanding: Money
}

export function calculateLoanOutstanding(
  loan: LoanWithTransactionsRecord,
): LoanOutstandingSnapshot {
  const amountAlreadyPaid = loan.transactions.reduce((total, tx) => {
    return tx.amount.isPositive() ? total.add(tx.amount) : total
  }, Money.zero())

  const outstanding = loan.amount.subtract(amountAlreadyPaid)

  return {
    amountAlreadyPaid,
    outstanding: outstanding.clampZero(),
  }
}

export interface LoanPaymentParams {
  loan: LoanWithTransactionsRecord
  amount: Money
  payerUserId: string
  incrementBalanceUnitService: IncrementBalanceUnitService
  loansRepository: LoansRepositoryPort
  tx?: TransactionClient
}

export interface LoanPaymentResult {
  paid: Money
  remaining: Money
  transaction?: Transaction
  fullySettled: boolean
}

export async function settleLoanPayment({
  loan,
  amount,
  payerUserId,
  incrementBalanceUnitService,
  loansRepository,
  tx,
}: LoanPaymentParams): Promise<LoanPaymentResult> {
  const { amountAlreadyPaid, outstanding } = calculateLoanOutstanding(loan)

  if (!outstanding.isPositive()) {
    if (loan.status !== LoanStatus.PAID_OFF) {
      await loansRepository.update(
        loan.id,
        {
          status: LoanStatus.PAID_OFF,
          paidAt: loan.paidAt ?? new Date(),
        },
        tx,
      )
    }

    return {
      paid: Money.zero(),
      remaining: Money.zero(),
      fullySettled: true,
    }
  }

  const amountToPay = outstanding.lessThan(amount) ? outstanding : amount

  if (amountToPay.isZero() || amountToPay.isNegative()) {
    return {
      paid: Money.zero(),
      remaining: outstanding,
      fullySettled: false,
    }
  }

  const unitTx = await incrementBalanceUnitService.execute(
    loan.unitId,
    payerUserId,
    amountToPay.toNumber(),
    { reason: TransactionReason.PAY_LOAN, tx },
    undefined,
    true,
    loan.id,
    undefined,
  )

  const paidAfterOperation = amountAlreadyPaid.add(amountToPay)
  const remaining = loan.amount.subtract(paidAfterOperation).clampZero()

  let fullySettled = false

  if (!paidAfterOperation.lessThan(loan.amount)) {
    await loansRepository.update(
      loan.id,
      {
        status: LoanStatus.PAID_OFF,
        paidAt: new Date(),
      },
      tx,
    )
    fullySettled = true
  }

  return {
    paid: amountToPay,
    remaining,
    transaction: unitTx.transaction,
    fullySettled,
  }
}
