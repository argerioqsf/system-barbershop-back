export class InvalidLoanError extends Error {
  private constructor(message: string) {
    super(message)
    this.name = 'InvalidLoanError'
  }

  static amountMustBePositive(): InvalidLoanError {
    return new InvalidLoanError('Loan amount must be positive')
  }

  static paidLoanMustHavePaymentDate(): InvalidLoanError {
    return new InvalidLoanError('Paid off loans must have paidAt defined')
  }

  static paidAtNotAllowed(): InvalidLoanError {
    return new InvalidLoanError('paidAt is only allowed when loan is paid off')
  }
}
