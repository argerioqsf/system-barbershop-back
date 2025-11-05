import { Money } from '@/core/domain/value-objects/money'
import { InvalidCashSessionError } from '../errors/invalid-cash-session-error'

export interface CashSessionProps {
  id?: string
  unitId: string
  openedByUserId: string
  openedAt?: Date
  openingAmount: Money
  finalAmount?: Money
  closedAt?: Date | null
}

export interface CashSessionSnapshot {
  id?: string
  unitId: string
  openedByUserId: string
  openedAt: Date
  openingAmount: Money
  finalAmount: Money
  closedAt: Date | null
}

export class CashSession {
  private constructor(private readonly props: CashSessionSnapshot) {}

  static open(props: CashSessionProps): CashSession {
    if (props.openingAmount.isNegative()) {
      throw InvalidCashSessionError.amountCannotBeNegative('Opening')
    }

    const openedAt = props.openedAt ?? new Date()
    const finalAmount = props.finalAmount ?? props.openingAmount

    return new CashSession({
      id: props.id,
      unitId: props.unitId,
      openedByUserId: props.openedByUserId,
      openedAt,
      openingAmount: props.openingAmount,
      finalAmount,
      closedAt: props.closedAt ?? null,
    })
  }

  get id(): string | undefined {
    return this.props.id
  }

  get unitId(): string {
    return this.props.unitId
  }

  get openedByUserId(): string {
    return this.props.openedByUserId
  }

  get openedAt(): Date {
    return this.props.openedAt
  }

  get openingAmount(): Money {
    return this.props.openingAmount
  }

  get finalAmount(): Money {
    return this.props.finalAmount
  }

  get closedAt(): Date | null {
    return this.props.closedAt
  }

  get isOpen(): boolean {
    return this.props.closedAt === null
  }

  updateFinalAmount(amount: Money): CashSession {
    return new CashSession({
      ...this.props,
      finalAmount: amount,
    })
  }

  close(finalAmount: Money, closedAt: Date = new Date()): CashSession {
    if (!this.isOpen) {
      return this
    }

    return new CashSession({
      ...this.props,
      finalAmount,
      closedAt,
    })
  }

  toObject(): CashSessionSnapshot {
    return { ...this.props }
  }
}
