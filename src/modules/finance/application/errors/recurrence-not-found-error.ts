import { ApplicationError } from '@/core/application/errors/application-error'

export class RecurrenceNotFoundError extends ApplicationError {
  constructor() {
    super('Recurrence not found.')
    this.name = 'RecurrenceNotFoundError'
  }
}
