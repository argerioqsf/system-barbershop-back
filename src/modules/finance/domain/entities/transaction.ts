import { Money } from '@/core/domain/value-objects/money'
import { InvalidTransactionError } from '../errors/invalid-transaction-error'

export const enum TransactionType {
  ADDITION = 'ADDITION',
  WITHDRAWAL = 'WITHDRAWAL',
}
export enum TransactionReason {
  OTHER = 'OTHER',
  UNIT_MAINTENANCE = 'UNIT_MAINTENANCE',
  LOAN = 'LOAN',
  CASH_OPENING = 'CASH_OPENING',
  PAY_LOAN = 'PAY_LOAN',
  PAY_COMMISSION = 'PAY_COMMISSION',
  PAY_PLAN_DEBT = 'PAY_PLAN_DEBT',
  ADD_COMMISSION = 'ADD_COMMISSION',
}
export interface TransactionProps {
  id?: string
  amount: Money
  reason: TransactionReason
  description?: string | null
  createdAt?: Date
  userId: string
  affectedUserId?: string | null
  saleId?: string | null
  saleItemId?: string | null
  sessionId?: string | null
  unitId?: string | null
  loanId?: string | null
  appointmentServiceId?: string | null
  receiptUrl?: string | null
}

export interface TransactionSnapshot {
  id?: string
  amount: Money
  reason: TransactionReason
  description: string | null
  createdAt: Date
  userId: string
  affectedUserId: string | null
  saleId: string | null
  saleItemId: string | null
  sessionId: string | null
  unitId: string | null
  loanId: string | null
  appointmentServiceId: string | null
  receiptUrl: string | null
}

export class Transaction {
  private constructor(private readonly props: TransactionSnapshot) {}

  static create(props: TransactionProps): Transaction {
    if (props.amount.isZero()) {
      throw InvalidTransactionError.amountCannotBeZero()
    }

    if (!props.reason) {
      throw InvalidTransactionError.reasonIsRequired()
    }

    const normalized: TransactionSnapshot = {
      id: props.id,
      amount: props.amount,
      reason: props.reason,
      description: normalizeNullable(props.description),
      createdAt: props.createdAt ?? new Date(),
      userId: props.userId,
      affectedUserId: normalizeNullable(props.affectedUserId),
      saleId: normalizeNullable(props.saleId),
      saleItemId: normalizeNullable(props.saleItemId),
      sessionId: normalizeNullable(props.sessionId),
      unitId: normalizeNullable(props.unitId),
      loanId: normalizeNullable(props.loanId),
      appointmentServiceId: normalizeNullable(props.appointmentServiceId),
      receiptUrl: normalizeNullable(props.receiptUrl),
    }

    return new Transaction(normalized)
  }

  withId(id: string): Transaction {
    return new Transaction({
      ...this.props,
      id,
    })
  }

  get id(): string | undefined {
    return this.props.id
  }

  get amount(): Money {
    return this.props.amount
  }

  get reason(): TransactionReason {
    return this.props.reason
  }

  get description(): string | null {
    return this.props.description
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get userId(): string {
    return this.props.userId
  }

  get affectedUserId(): string | null {
    return this.props.affectedUserId
  }

  get saleId(): string | null {
    return this.props.saleId
  }

  get saleItemId(): string | null {
    return this.props.saleItemId
  }

  get sessionId(): string | null {
    return this.props.sessionId
  }

  get unitId(): string | null {
    return this.props.unitId
  }

  get loanId(): string | null {
    return this.props.loanId
  }

  get appointmentServiceId(): string | null {
    return this.props.appointmentServiceId
  }

  get receiptUrl(): string | null {
    return this.props.receiptUrl
  }

  toObject(): TransactionSnapshot {
    return { ...this.props }
  }
}

function normalizeNullable(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}
