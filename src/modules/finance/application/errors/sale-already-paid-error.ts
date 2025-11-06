import { ApplicationError } from '@/core/application/errors/application-error'

export class SaleAlreadyPaidError extends ApplicationError {
  constructor() {
    super('Sale has already been paid.')
    this.name = 'SaleAlreadyPaidError'
  }
}
