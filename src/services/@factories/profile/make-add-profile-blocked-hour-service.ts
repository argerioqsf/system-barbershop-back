import { PrismaProfileBlockedHourRepository } from '@/repositories/prisma/prisma-profile-blocked-hour-repository'
import { PrismaProfileWorkHourRepository } from '@/repositories/prisma/prisma-profile-work-hour-repository'
import { AddProfileBlockedHourService } from '@/services/profile/add-profile-blocked-hour'
import { PrismaDayHourRepository } from '@/repositories/prisma/prisma-day-hour-repository'

export function makeAddProfileBlockedHourService() {
  return new AddProfileBlockedHourService(
    new PrismaProfileBlockedHourRepository(),
    new PrismaProfileWorkHourRepository(),
    new PrismaDayHourRepository(),
  )
}
