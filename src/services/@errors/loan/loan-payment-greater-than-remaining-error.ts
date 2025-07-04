export class LoanPaymentGreaterThanRemainingError extends Error {
  constructor() {
    super('Payment amount greater than remaining loan balance')
  }
}
