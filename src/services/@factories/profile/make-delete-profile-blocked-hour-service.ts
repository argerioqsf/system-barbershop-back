import { PrismaProfileBlockedHourRepository } from '@/repositories/prisma/prisma-profile-blocked-hour-repository'
import { DeleteProfileBlockedHourService } from '@/services/profile/delete-profile-blocked-hour'

export function makeDeleteProfileBlockedHourService() {
  return new DeleteProfileBlockedHourService(
    new PrismaProfileBlockedHourRepository(),
  )
}
