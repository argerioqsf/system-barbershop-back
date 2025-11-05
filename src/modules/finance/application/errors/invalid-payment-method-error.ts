import { ApplicationError } from '@/core/application/errors/application-error'

export class InvalidPaymentMethodError extends ApplicationError {
  constructor() {
    super('Invalid payment method for this sale.')
    this.name = 'InvalidPaymentMethodError'
  }
}
