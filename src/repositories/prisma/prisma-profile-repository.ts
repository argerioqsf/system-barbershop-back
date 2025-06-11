import { prisma } from '@/lib/prisma'
import { Prisma, Profile, User } from '@prisma/client'
import { ProfilesRepository } from '../profiles-repository'

export class PrismaProfilesRepository implements ProfilesRepository {
  async update(id: string, data: Prisma.ProfileUncheckedUpdateInput): Promise<Profile> {
    const profile = await prisma.profile.update({
      where: { id },
      data,
    })

    return profile
  }

  async findById(id: string): Promise<(Profile & { user: User }) | null> {
    return prisma.profile.findUnique({
      where: { id },
      include: { user: true },
    })
  }

  async findByUserId(id: string): Promise<(Profile & { user: User }) | null> {
    return prisma.profile.findUnique({
      where: { userId: id },
      include: { user: true },
    })
  }

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    return prisma.profile.create({ data })
  }

  async findMany(
    where?: Prisma.ProfileWhereInput,
    orderBy?: Prisma.ProfileOrderByWithRelationInput,
  ): Promise<(Profile & { user: User })[]> {
    return prisma.profile.findMany({
      where: { ...where },
      include: { user: true },
      orderBy: { ...orderBy },
    })
  }
}
