import { PrismaProfileWorkHourRepository } from '@/repositories/prisma/prisma-profile-work-hour-repository'
import { AddProfileWorkHourService } from '@/services/profile/add-profile-work-hour'

export function makeAddProfileWorkHourService() {
  return new AddProfileWorkHourService(new PrismaProfileWorkHourRepository())
}
