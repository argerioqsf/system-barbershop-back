import { prisma } from '@/lib/prisma'
import { Prisma, Profile, User } from '@prisma/client'
import { BarberUsersRepository } from '../barber-users-repository'

export class PrismaBarberUsersRepository implements BarberUsersRepository {
  async create(
    data: Prisma.UserCreateInput,
    profileData: Prisma.ProfileCreateInput,
  ): Promise<{ user: User; profile: Profile }> {
    const user = await prisma.user.create({ data })
    const profile = await prisma.profile.create({
      data: { ...profileData, userId: user.id },
    })
    return { user, profile }
  }

  async findMany(): Promise<(User & { profile: Profile | null })[]> {
    return prisma.user.findMany({ include: { profile: true } })
  }

  async findById(id: string): Promise<(User & { profile: Profile | null }) | null> {
    return prisma.user.findUnique({ where: { id }, include: { profile: true } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }
}
