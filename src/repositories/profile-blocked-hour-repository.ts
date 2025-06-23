import { Prisma, ProfileBlockedHour } from '@prisma/client'

export interface ProfileBlockedHourRepository {
  create(
    data: Prisma.ProfileBlockedHourUncheckedCreateInput,
  ): Promise<ProfileBlockedHour>
  findManyByProfile(profileId: string): Promise<ProfileBlockedHour[]>
}
