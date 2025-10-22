import { Percentage } from './percentage'

const SCALE = 100

export class Money {
  private constructor(private readonly cents: number) {}

  static zero(): Money {
    return new Money(0)
  }

  static from(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid monetary value')
    }

    return new Money(Math.round(amount * SCALE))
  }

  private static fromCents(value: number): Money {
    return new Money(Math.round(value))
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents)
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents)
  }

  multiply(multiplier: number): Money {
    if (!Number.isFinite(multiplier)) {
      throw new Error('Invalid multiplier for money operation')
    }

    return Money.fromCents(this.cents * multiplier)
  }

  divide(divisor: number): Money {
    if (!Number.isFinite(divisor) || divisor === 0) {
      throw new Error('Invalid divisor for money operation')
    }

    return Money.fromCents(this.cents / divisor)
  }

  percentage(percentage: Percentage): Money {
    return Money.fromCents(this.cents * percentage.toDecimal())
  }

  clampZero(): Money {
    return this.cents < 0 ? Money.zero() : this
  }

  isNegative(): boolean {
    return this.cents < 0
  }

  toNumber(): number {
    return this.cents / SCALE
  }
}
