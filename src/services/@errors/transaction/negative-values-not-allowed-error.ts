export class NegativeValuesNotAllowedError extends Error {
  constructor() {
    super('Negative values \u200b\u200bcannot be passed on withdrawals')
  }
}
