import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { ListTypeRecurrencesService } from '@/services/type-recurrence/list-type-recurrences'

export function makeListTypeRecurrencesService() {
  return new ListTypeRecurrencesService(new PrismaTypeRecurrenceRepository())
}
