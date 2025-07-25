import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { CreateTypeRecurrenceService } from '@/services/type-recurrence/create-type-recurrence'

export function makeCreateTypeRecurrenceService() {
  return new CreateTypeRecurrenceService(new PrismaTypeRecurrenceRepository())
}
