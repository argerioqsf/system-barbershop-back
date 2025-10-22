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

  toNumber(): number {
    return this.value
  }

  toDecimal(): number {
    return this.value / 100
  }
}
