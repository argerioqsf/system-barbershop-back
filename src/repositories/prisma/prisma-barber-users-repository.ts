import { prisma } from '@/lib/prisma'
import { Prisma, Profile, Unit, User } from '@prisma/client'
import { BarberUsersRepository } from '../barber-users-repository'

export class PrismaBarberUsersRepository implements BarberUsersRepository {
  async create(
    data: Prisma.UserCreateInput,
    profileData: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
  ): Promise<{ user: User; profile: Profile }> {
    const user = await prisma.user.create({ data })
    const profile = await prisma.profile.create({
      data: { ...profileData, userId: user.id },
    })
    return { user, profile }
  }

  async update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
    permissionIds?: string[],
  ): Promise<{ user: User; profile: Profile | null }> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: {
          update: {
            ...profileData,
            ...(permissionIds && {
              permissions: { set: permissionIds.map((id) => ({ id })) },
            }),
          },
        },
      },
      include: { profile: true },
    })

    return { user, profile: user.profile }
  }

  async findMany(
    where: Prisma.UserWhereInput = {},
  ): Promise<(User & { profile: Profile | null })[]> {
    return prisma.user.findMany({ where, include: { profile: true } })
  }

  async findById(
    id: string,
  ): Promise<(User & { profile: Profile | null; unit: Unit | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true, unit: true },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }
}
