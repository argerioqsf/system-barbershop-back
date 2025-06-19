export class WithdrawalGreaterThanUnitBalanceError extends Error {
  constructor() {
    super('Withdrawal amount greater than unit balance')
  }
}
