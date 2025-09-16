import { PrismaProfileWorkHourRepository } from '@/repositories/prisma/prisma-profile-work-hour-repository'
import { PrismaProfileBlockedHourRepository } from '@/repositories/prisma/prisma-profile-blocked-hour-repository'
import { DeleteProfileWorkHourService } from '@/services/profile/delete-profile-work-hour'

export function makeDeleteProfileWorkHourService() {
  return new DeleteProfileWorkHourService(
    new PrismaProfileWorkHourRepository(),
    new PrismaProfileBlockedHourRepository(),
  )
}
