import { ApplicationError } from '@/core/application/errors/application-error'

export class InvalidPayCommissionInputError extends ApplicationError {
  constructor() {
    super(
      'PayCommissionUseCase requires an amount or at least one item identifier',
    )
    this.name = 'InvalidPayCommissionInputError'
  }
}
