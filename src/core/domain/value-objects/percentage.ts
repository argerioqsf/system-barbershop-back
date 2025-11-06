export class Percentage {
  private constructor(private readonly value: number) {}

  static from(value: number): Percentage {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid percentage value')
    }

    if (value < 0) {
      throw new Error('Percentage cannot be negative')
    }

    return new Percentage(value)
  }

  add(other: Percentage): Percentage {
    return Percentage.from(this.value + other.value)
  }

  subtract(other: Percentage): Percentage {
    const result = this.value - other.value

    if (result < 0) {
      throw new Error('Percentage result cannot be negative')
    }

    return Percentage.from(result)
  }

  multiply(multiplier: number): Percentage {
    if (!Number.isFinite(multiplier)) {
      throw new Error('Invalid multiplier for percentage operation')
    }

    const result = this.value * multiplier

    if (result < 0) {
      throw new Error('Percentage cannot be negative')
    }

    return Percentage.from(result)
  }

  toNumber(): number {
    return this.value
  }

  toDecimal(): number {
    return this.value / 100
  }
}
