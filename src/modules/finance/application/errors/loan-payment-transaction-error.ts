import { ApplicationError } from '@/core/application/errors/application-error'

export class LoanPaymentTransactionError extends ApplicationError {
  constructor() {
    super('Loan payment failed to create transaction.')
    this.name = 'LoanPaymentTransactionError'
  }
}
