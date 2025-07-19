import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'
import { TypeRecurrence, Prisma } from '@prisma/client'

interface UpdateTypeRecurrenceRequest {
  id: string
  data: Prisma.TypeRecurrenceUpdateInput
}

interface UpdateTypeRecurrenceResponse {
  typeRecurrence: TypeRecurrence
}

export class UpdateTypeRecurrenceService {
  constructor(private repository: TypeRecurrenceRepository) {}

  async execute({
    id,
    data,
  }: UpdateTypeRecurrenceRequest): Promise<UpdateTypeRecurrenceResponse> {
    const typeRecurrence = await this.repository.update(id, data)
    return { typeRecurrence }
  }
}
