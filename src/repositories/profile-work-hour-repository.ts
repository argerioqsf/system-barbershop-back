import { Prisma, ProfileWorkHour } from '@prisma/client'

export interface ProfileWorkHourRepository {
  create(
    data: Prisma.ProfileWorkHourUncheckedCreateInput,
  ): Promise<ProfileWorkHour>
  findManyByProfile(profileId: string): Promise<ProfileWorkHour[]>
}
