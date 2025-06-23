import { prisma } from '@/lib/prisma'
import { Prisma, ProfileWorkHour } from '@prisma/client'
import { ProfileWorkHourRepository } from '../profile-work-hour-repository'

export class PrismaProfileWorkHourRepository
  implements ProfileWorkHourRepository
{
  async create(
    data: Prisma.ProfileWorkHourUncheckedCreateInput,
  ): Promise<ProfileWorkHour> {
    return prisma.profileWorkHour.create({ data })
  }

  async findManyByProfile(profileId: string): Promise<ProfileWorkHour[]> {
    return prisma.profileWorkHour.findMany({ where: { profileId } })
  }
}
