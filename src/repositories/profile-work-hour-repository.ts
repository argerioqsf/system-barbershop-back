import { Prisma, ProfileWorkHour } from '@prisma/client'

export interface ProfileWorkHourRepository {
  create(
    data: Prisma.ProfileWorkHourUncheckedCreateInput,
  ): Promise<ProfileWorkHour>
  findById(id: string): Promise<ProfileWorkHour | null>
  findManyByProfile(
    profileId: string,
    weekDay?: number,
  ): Promise<ProfileWorkHour[]>
  delete(id: string): Promise<void>
}
