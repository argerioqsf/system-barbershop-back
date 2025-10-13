export class ValidateSaleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidateSaleError'
  }
}
