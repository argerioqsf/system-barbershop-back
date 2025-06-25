import { PrismaProfileWorkHourRepository } from '@/repositories/prisma/prisma-profile-work-hour-repository'
import { DeleteProfileWorkHourService } from '@/services/profile/delete-profile-work-hour'

export function makeDeleteProfileWorkHourService() {
  return new DeleteProfileWorkHourService(new PrismaProfileWorkHourRepository())
}
