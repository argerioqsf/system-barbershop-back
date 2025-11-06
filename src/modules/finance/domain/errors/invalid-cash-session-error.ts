export class InvalidCashSessionError extends Error {
  private constructor(message: string) {
    super(message)
    this.name = 'InvalidCashSessionError'
  }

  static amountCannotBeNegative(field: string): InvalidCashSessionError {
    return new InvalidCashSessionError(`${field} amount cannot be negative`)
  }
}
