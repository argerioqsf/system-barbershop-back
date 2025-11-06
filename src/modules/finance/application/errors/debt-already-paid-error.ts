export class DebtAlreadyPaidError extends Error {
  constructor() {
    super('Debt has already been paid.')
    this.name = 'DebtAlreadyPaidError'
  }
}
