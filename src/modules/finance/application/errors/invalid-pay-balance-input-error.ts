import { ApplicationError } from '@/core/application/errors/application-error'

export class InvalidPayBalanceInputError extends ApplicationError {
  constructor() {
    super(
      'It is mandatory to pass at least one of: amount, saleItemIds, appointmentServiceIds',
    )
    this.name = 'InvalidPayBalanceInputError'
  }
}
