import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { GetTypeRecurrenceService } from '@/services/type-recurrence/get-type-recurrence'

export function makeGetTypeRecurrenceService() {
  return new GetTypeRecurrenceService(new PrismaTypeRecurrenceRepository())
}
