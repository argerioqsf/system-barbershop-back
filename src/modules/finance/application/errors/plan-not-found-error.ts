import { ApplicationError } from '@/core/application/errors/application-error'

export class PlanNotFoundError extends ApplicationError {
  constructor() {
    super('Plan not found.')
    this.name = 'PlanNotFoundError'
  }
}
