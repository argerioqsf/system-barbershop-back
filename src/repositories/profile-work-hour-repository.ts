import { Prisma, ProfileWorkHour } from '@prisma/client'

export interface ProfileWorkHourRepository {
  create(
    data: Prisma.ProfileWorkHourUncheckedCreateInput,
  ): Promise<ProfileWorkHour>
  findManyByProfile(
    profileId: string,
    weekDay?: number,
  ): Promise<ProfileWorkHour[]>
}
