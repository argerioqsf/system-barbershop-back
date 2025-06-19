export class CashRegisterClosedError extends Error {
  constructor() {
    super('Cash register closed')
  }
}
