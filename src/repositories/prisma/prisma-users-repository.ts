import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'
import { Prisma, Profile, User } from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class PrismaUsersRepository implements UsersRepository {
  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data,
    })

    return user
  }

  async findManyIndicator(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  > {
    const userIndicator = await prisma.user.findMany({
      where: {
        ...where,
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        organizationId: true,
        unitId: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
            commissionPercentage: true,
            totalBalance: true,
            createdAt: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return userIndicator
  }

  async findById(
    id: string,
  ): Promise<
    | (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })
    | null
  > {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
    if (!user) return null
    const { ...rest } = user
    return rest as Omit<User, 'password'> & {
      profile: Omit<Profile, 'userId'> | null
    }
  }

  async findByEmail(
    email: string,
  ): Promise<(User & { profile: Profile | null }) | null> {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    })
    return user
  }

  async create(data: Prisma.UserCreateInput) {
    const user = await prisma.user.create({
      data,
    })
    return user
  }

  async findMany(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  > {
    const users = await prisma.user.findMany({
      where: {
        ...where,
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        organizationId: true,
        unitId: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
            commissionPercentage: true,
            totalBalance: true,
            createdAt: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return users
  }

  async count(where: Prisma.UserWhereInput): Promise<number> {
    const users = await prisma.user.count({
      where: {
        ...where,
      },
    })

    return users
  }

  async countIndicator(where: Prisma.UserWhereInput): Promise<number> {
    const users = await prisma.user.count({
      where: {
        ...where,
      },
    })

    return users
  }
}
