import { ApplicationError } from '@/core/application/errors/application-error'

export class MissingCommissionMetaError extends ApplicationError {
  constructor() {
    super('Missing commission calculation meta data.')
    this.name = 'MissingCommissionMetaError'
  }
}
