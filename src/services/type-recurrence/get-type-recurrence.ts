import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'
import { TypeRecurrence } from '@prisma/client'

interface GetTypeRecurrenceRequest {
  id: string
}

interface GetTypeRecurrenceResponse {
  typeRecurrence: TypeRecurrence | null
}

export class GetTypeRecurrenceService {
  constructor(private repository: TypeRecurrenceRepository) {}

  async execute({
    id,
  }: GetTypeRecurrenceRequest): Promise<GetTypeRecurrenceResponse> {
    const typeRecurrence = await this.repository.findById(id)
    return { typeRecurrence }
  }
}
