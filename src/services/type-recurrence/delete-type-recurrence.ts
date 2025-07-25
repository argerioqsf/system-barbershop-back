import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'

interface DeleteTypeRecurrenceRequest {
  id: string
}

export class DeleteTypeRecurrenceService {
  constructor(private repository: TypeRecurrenceRepository) {}

  async execute({ id }: DeleteTypeRecurrenceRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
