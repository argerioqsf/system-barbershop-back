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

    return Money.fromCents(Math.round(amount * SCALE))
  }

  static fromCents(value: number): Money {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid monetary value')
    }

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

  percentage(percentage: { toDecimal(): number }): Money {
    return Money.fromCents(this.cents * percentage.toDecimal())
  }

  clampZero(): Money {
    return this.cents < 0 ? Money.zero() : this
  }

  isNegative(): boolean {
    return this.cents < 0
  }

  isPositive(): boolean {
    return this.cents > 0
  }

  isZero(): boolean {
    return this.cents === 0
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents
  }

  lessThan(other: Money): boolean {
    return this.cents < other.cents
  }

  negate(): Money {
    return Money.fromCents(-this.cents)
  }

  abs(): Money {
    return this.cents < 0 ? this.negate() : this
  }

  toNumber(): number {
    return this.cents / SCALE
  }
}
