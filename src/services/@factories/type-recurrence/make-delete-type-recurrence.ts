import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { DeleteTypeRecurrenceService } from '@/services/type-recurrence/delete-type-recurrence'

export function makeDeleteTypeRecurrenceService() {
  return new DeleteTypeRecurrenceService(new PrismaTypeRecurrenceRepository())
}
