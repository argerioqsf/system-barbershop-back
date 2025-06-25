import { PrismaProfileBlockedHourRepository } from '@/repositories/prisma/prisma-profile-blocked-hour-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaProfileWorkHourRepository } from '@/repositories/prisma/prisma-profile-work-hour-repository'
import { AddProfileBlockedHourService } from '@/services/profile/add-profile-blocked-hour'

export function makeAddProfileBlockedHourService() {
  return new AddProfileBlockedHourService(
    new PrismaProfileBlockedHourRepository(),
    new PrismaProfileWorkHourRepository(),
    new PrismaProfilesRepository(),
  )
}
