import { prisma } from '@/lib/prisma'
import { Prisma, Profile, User } from '@prisma/client'
import { ProfilesRepository } from '../profiles-repository'

export class PrismaProfilesRepository implements ProfilesRepository {
  async update(
    id: string,
    data: Prisma.ProfileUncheckedUpdateInput,
  ): Promise<Profile> {
    const profile = await prisma.profile.update({
      where: { id },
      data,
    })

    return profile
  }

  async findById(
    id: string,
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            organizationId: true,
            unitId: true,
            createdAt: true,
          },
        },
      },
    })
    return profile as (Profile & { user: Omit<User, 'password'> }) | null
  }

  async findByUserId(
    id: string,
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            organizationId: true,
            unitId: true,
            createdAt: true,
          },
        },
      },
    })
    return profile as (Profile & { user: Omit<User, 'password'> }) | null
  }

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    return prisma.profile.create({ data })
  }

  async findMany(
    where?: Prisma.ProfileWhereInput,
    orderBy?: Prisma.ProfileOrderByWithRelationInput,
  ): Promise<(Profile & { user: Omit<User, 'password'> })[]> {
    const profiles = await prisma.profile.findMany({
      where: { ...where },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            organizationId: true,
            unitId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { ...orderBy },
    })
    return profiles as (Profile & { user: Omit<User, 'password'> })[]
  }

  async incrementBalance(userId: string, amount: number): Promise<void> {
    await prisma.profile.update({
      where: { userId },
      data: { totalBalance: { increment: amount } },
    })
  }
}
