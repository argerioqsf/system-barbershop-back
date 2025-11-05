export class LoanAlreadyPaidError extends Error {
  constructor() {
    super('Loan has already been paid.')
    this.name = 'LoanAlreadyPaidError'
  }
}
