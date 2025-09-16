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

  async findById(id: string): Promise<ProfileWorkHour | null> {
    return prisma.profileWorkHour.findUnique({ where: { id } })
  }

  async findManyByProfile(
    profileId: string,
    weekDay?: number,
  ): Promise<ProfileWorkHour[]> {
    return prisma.profileWorkHour.findMany({
      where: { profileId, ...(weekDay ? { weekDay } : {}) },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.profileWorkHour.delete({ where: { id } })
  }
}
