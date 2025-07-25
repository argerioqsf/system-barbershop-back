import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'
import { TypeRecurrence } from '@prisma/client'

interface ListTypeRecurrencesResponse {
  types: TypeRecurrence[]
}

export class ListTypeRecurrencesService {
  constructor(private repository: TypeRecurrenceRepository) {}

  async execute(): Promise<ListTypeRecurrencesResponse> {
    const types = await this.repository.findMany()
    return { types }
  }
}
