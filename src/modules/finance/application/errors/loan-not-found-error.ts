export class LoanNotFoundError extends Error {
  constructor() {
    super('Loan not found.')
    this.name = 'LoanNotFoundError'
  }
}
