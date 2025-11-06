export class InvalidDebtError extends Error {
  private constructor(message: string) {
    super(message)
    this.name = 'InvalidDebtError'
  }

  static amountCannotBeNegative(): InvalidDebtError {
    return new InvalidDebtError('Debt amount cannot be negative')
  }

  static paidDebtMustHavePaymentDate(): InvalidDebtError {
    return new InvalidDebtError('Paid debt must include payment date')
  }

  static pendingDebtCannotHavePaymentDate(): InvalidDebtError {
    return new InvalidDebtError('Pending debt cannot have payment date')
  }
}
