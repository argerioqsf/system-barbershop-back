import { ApplicationError } from '@/core/application/errors/application-error'

export class UnitRequiredForTransactionError extends ApplicationError {
  constructor() {
    super('Transaction creation requires an associated unit.')
    this.name = 'UnitRequiredForTransactionError'
  }
}
