import { prisma } from '@/lib/prisma'
import { Prisma, ProfileBlockedHour } from '@prisma/client'
import { ProfileBlockedHourRepository } from '../profile-blocked-hour-repository'

export class PrismaProfileBlockedHourRepository
  implements ProfileBlockedHourRepository
{
  async create(
    data: Prisma.ProfileBlockedHourUncheckedCreateInput,
  ): Promise<ProfileBlockedHour> {
    return prisma.profileBlockedHour.create({ data })
  }

  async findManyByProfile(profileId: string): Promise<ProfileBlockedHour[]> {
    return prisma.profileBlockedHour.findMany({ where: { profileId } })
  }

  async delete(id: string): Promise<void> {
    await prisma.profileBlockedHour.delete({ where: { id } })
  }
}
