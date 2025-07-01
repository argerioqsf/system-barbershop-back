export class LoanMonthlyLimitExceededError extends Error {
  constructor() {
    super('Loan monthly limit exceeded')
  }
}
