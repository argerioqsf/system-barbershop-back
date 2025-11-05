import { Money } from '@/core/domain/value-objects/money'
import { DebtStatus } from '../types/status'
import { InvalidDebtError } from '../errors/invalid-debt-error'

export interface DebtProps {
  id?: string
  planId: string
  planProfileId: string
  amount: Money
  status?: DebtStatus
  dueDate: Date
  paymentDate?: Date | null
  createdAt?: Date
}

export interface DebtSnapshot {
  id?: string
  planId: string
  planProfileId: string
  amount: Money
  status: DebtStatus
  dueDate: Date
  paymentDate: Date | null
  createdAt: Date
}

export class Debt {
  private constructor(private readonly props: DebtSnapshot) {}

  static create(props: DebtProps): Debt {
    const status = props.status ?? DebtStatus.PENDING

    if (props.amount.isNegative()) {
      throw InvalidDebtError.amountCannotBeNegative()
    }

    if (status === DebtStatus.PAID && !props.paymentDate) {
      throw InvalidDebtError.paidDebtMustHavePaymentDate()
    }

    if (status === DebtStatus.PENDING && props.paymentDate) {
      throw InvalidDebtError.pendingDebtCannotHavePaymentDate()
    }

    return new Debt({
      id: props.id,
      planId: props.planId,
      planProfileId: props.planProfileId,
      amount: props.amount,
      status,
      dueDate: props.dueDate,
      paymentDate: props.paymentDate ?? null,
      createdAt: props.createdAt ?? new Date(),
    })
  }

  get id(): string | undefined {
    return this.props.id
  }

  get planId(): string {
    return this.props.planId
  }

  get planProfileId(): string {
    return this.props.planProfileId
  }

  get amount(): Money {
    return this.props.amount
  }

  get status(): DebtStatus {
    return this.props.status
  }

  get paymentDate(): Date | null {
    return this.props.paymentDate
  }

  get dueDate(): Date {
    return this.props.dueDate
  }

  markAsPaid(paymentDate: Date = new Date()): Debt {
    return new Debt({
      ...this.props,
      status: DebtStatus.PAID,
      paymentDate,
    })
  }

  markAsPending(): Debt {
    return new Debt({
      ...this.props,
      status: DebtStatus.PENDING,
      paymentDate: null,
    })
  }

  toObject(): DebtSnapshot {
    return { ...this.props }
  }
}
