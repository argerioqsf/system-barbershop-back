export class InvalidSaleItemError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSaleItemError'
  }
}
