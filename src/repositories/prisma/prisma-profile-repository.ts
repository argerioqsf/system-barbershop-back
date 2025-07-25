import { prisma } from '@/lib/prisma'
import { Prisma, Profile, Unit, User } from '@prisma/client'
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

  async findByUserId(id: string): Promise<
    | (Profile & {
        user: Omit<User, 'password'> & { unit: Unit }
        permissions: { id: string; name: string }[]
      })
    | null
  > {
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
            unit: true,
            versionToken: true,
            versionTokenInvalidate: true,
          },
        },
        permissions: { select: { id: true, name: true } },
      },
    })
    return profile
  }

  async create(
    data: Prisma.ProfileUncheckedCreateInput,
    permissionIds?: string[],
  ): Promise<Profile> {
    return prisma.profile.create({
      data: {
        ...data,
        ...(permissionIds && {
          permissions: { connect: permissionIds.map((id) => ({ id })) },
        }),
      },
    })
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

  async incrementBalance(
    userId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Profile & { user: Omit<User, 'password'> }> {
    const prismaClient = tx || prisma
    const profile = await prismaClient.profile.update({
      where: { userId },
      data: { totalBalance: { increment: amount } },
      include: { user: true },
    })
    return profile
  }
}
