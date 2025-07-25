import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { UpdateTypeRecurrenceService } from '@/services/type-recurrence/update-type-recurrence'

export function makeUpdateTypeRecurrenceService() {
  return new UpdateTypeRecurrenceService(new PrismaTypeRecurrenceRepository())
}
