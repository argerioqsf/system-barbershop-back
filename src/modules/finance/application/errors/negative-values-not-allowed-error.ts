export class NegativeValuesNotAllowedError extends Error {
  constructor() {
    super('Negative values cannot be passed on withdrawals')
  }
}
