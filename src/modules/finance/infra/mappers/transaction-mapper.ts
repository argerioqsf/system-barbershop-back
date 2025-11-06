import {
  Transaction as PrismaTransaction,
  TransactionType,
} from '@prisma/client'
import { Money } from '@/core/domain/value-objects/money'
import {
  Transaction,
  TransactionReason,
} from '@/modules/finance/domain/entities/transaction'
import { ReasonMapper } from './reason-mapper'

export type PrismaTransactionWithRelations = PrismaTransaction

export class TransactionMapper {
  static toDomain(transaction: PrismaTransactionWithRelations): Transaction {
    const amount = Money.from(transaction.amount)
    const signedAmount =
      transaction.type === TransactionType.WITHDRAWAL ? amount.negate() : amount

    return Transaction.create({
      id: transaction.id,
      amount: signedAmount,
      reason: ReasonMapper.toDomain(transaction.reason),
      description: transaction.description,
      createdAt: transaction.createdAt,
      userId: transaction.userId,
      affectedUserId: transaction.affectedUserId ?? null,
      saleId: transaction.saleId ?? null,
      saleItemId: transaction.saleItemId ?? null,
      sessionId: transaction.cashRegisterSessionId ?? null,
      unitId: transaction.unitId ?? null,
      loanId: transaction.loanId ?? null,
      appointmentServiceId: transaction.appointmentServiceId ?? null,
      receiptUrl: transaction.receiptUrl ?? null,
    })
  }

  static toPrismaData(
    transaction: Transaction,
    overrides?: { isLoan?: boolean },
  ): {
    amount: number
    type: TransactionType
    reason: TransactionReason
    description: string
    userId: string
    unitId: string | null
    cashRegisterSessionId: string | null
    affectedUserId: string | null
    saleId: string | null
    saleItemId: string | null
    appointmentServiceId: string | null
    receiptUrl: string | null
    loanId: string | null
    isLoan: boolean
  } {
    const amount = transaction.amount
    const isWithdrawal = amount.isNegative()
    const type = isWithdrawal
      ? TransactionType.WITHDRAWAL
      : TransactionType.ADDITION

    const absoluteAmount = amount.abs()

    return {
      amount: absoluteAmount.toNumber(),
      type,
      reason: transaction.reason,
      description: transaction.description ?? '',
      userId: transaction.userId,
      unitId: transaction.unitId ?? null,
      cashRegisterSessionId: transaction.sessionId ?? null,
      affectedUserId: transaction.affectedUserId ?? null,
      saleId: transaction.saleId ?? null,
      saleItemId: transaction.saleItemId ?? null,
      appointmentServiceId: transaction.appointmentServiceId ?? null,
      receiptUrl: transaction.receiptUrl ?? null,
      loanId: transaction.loanId ?? null,
      isLoan:
        overrides?.isLoan ??
        (transaction.reason === 'LOAN' || transaction.reason === 'PAY_LOAN'),
    }
  }
}
