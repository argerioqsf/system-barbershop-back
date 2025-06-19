export class CashRegisterNotOpenedError extends Error {
  constructor() {
    super('Cash register not opened')
  }
}
