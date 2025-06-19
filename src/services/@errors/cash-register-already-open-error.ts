export class CashRegisterAlreadyOpenError extends Error {
  constructor() {
    super('Cash register already open for this unit')
  }
}
