import { Money } from '@/core/domain/value-objects/money'
import { LoanStatus } from '../types/status'
import { InvalidLoanError } from '../errors/invalid-loan-error'

export interface LoanProps {
  id?: string
  unitId: string
  userId: string
  sessionId: string
  amount: Money
  status?: LoanStatus
  createdAt?: Date
  paidAt?: Date | null
  updatedById?: string | null
}

export interface LoanSnapshot {
  id?: string
  unitId: string
  userId: string
  sessionId: string
  amount: Money
  status: LoanStatus
  createdAt: Date
  paidAt: Date | null
  updatedById: string | null
}

export class Loan {
  private constructor(private readonly props: LoanSnapshot) {}

  static create(props: LoanProps): Loan {
    const status = props.status ?? LoanStatus.PENDING
    if (props.amount.isNegative() || props.amount.isZero()) {
      throw InvalidLoanError.amountMustBePositive()
    }

    const normalizedPaidAt = props.paidAt ?? null
    if (status === LoanStatus.PAID_OFF && !normalizedPaidAt) {
      throw InvalidLoanError.paidLoanMustHavePaymentDate()
    }

    if (status !== LoanStatus.PAID_OFF && normalizedPaidAt) {
      throw InvalidLoanError.paidAtNotAllowed()
    }

    return new Loan({
      id: props.id,
      unitId: props.unitId,
      userId: props.userId,
      sessionId: props.sessionId,
      amount: props.amount,
      status,
      createdAt: props.createdAt ?? new Date(),
      paidAt: normalizedPaidAt,
      updatedById: props.updatedById ?? null,
    })
  }

  get id(): string | undefined {
    return this.props.id
  }

  get unitId(): string {
    return this.props.unitId
  }

  get userId(): string {
    return this.props.userId
  }

  get sessionId(): string {
    return this.props.sessionId
  }

  get amount(): Money {
    return this.props.amount
  }

  get status(): LoanStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get paidAt(): Date | null {
    return this.props.paidAt
  }

  get updatedById(): string | null {
    return this.props.updatedById
  }

  markAsValueTransferred(updatedById?: string): Loan {
    return new Loan({
      ...this.props,
      status: LoanStatus.VALUE_TRANSFERRED,
      updatedById: updatedById ?? this.props.updatedById,
    })
  }

  markAsPaidOff(updatedById?: string, paidAt: Date = new Date()): Loan {
    return new Loan({
      ...this.props,
      status: LoanStatus.PAID_OFF,
      paidAt,
      updatedById: updatedById ?? this.props.updatedById,
    })
  }

  cancel(updatedById?: string): Loan {
    return new Loan({
      ...this.props,
      status: LoanStatus.CANCELED,
      updatedById: updatedById ?? this.props.updatedById,
    })
  }

  toObject(): LoanSnapshot {
    return { ...this.props }
  }
}
