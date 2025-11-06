export class InvalidTransactionError extends Error {
  private constructor(message: string) {
    super(message)
    this.name = 'InvalidTransactionError'
  }

  static amountCannotBeZero(): InvalidTransactionError {
    return new InvalidTransactionError('Transaction amount cannot be zero')
  }

  static reasonIsRequired(): InvalidTransactionError {
    return new InvalidTransactionError('Transaction reason is required')
  }
}
