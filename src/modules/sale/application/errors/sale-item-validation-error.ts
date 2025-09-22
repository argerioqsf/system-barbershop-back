export class SaleItemValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SaleItemValidationError'
  }
}
