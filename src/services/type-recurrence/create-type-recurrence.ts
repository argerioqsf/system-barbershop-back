import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'
import { TypeRecurrence } from '@prisma/client'

interface CreateTypeRecurrenceRequest {
  period: number
}

interface CreateTypeRecurrenceResponse {
  typeRecurrence: TypeRecurrence
}

export class CreateTypeRecurrenceService {
  constructor(private repository: TypeRecurrenceRepository) {}

  async execute({
    period,
  }: CreateTypeRecurrenceRequest): Promise<CreateTypeRecurrenceResponse> {
    const typeRecurrence = await this.repository.create({ period })
    return { typeRecurrence }
  }
}
