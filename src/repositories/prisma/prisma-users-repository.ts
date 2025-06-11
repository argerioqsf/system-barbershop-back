import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'
import { Prisma, Profile, User } from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class PrismaUsersRepository implements UsersRepository {
  async mountSelectIndicator(
    where: Prisma.UserWhereInput,
  ): Promise<
    Omit<
      User & { profile: { id: string; amountToReceive: number | null } | null },
      'email' | 'password' | 'active'
    >[]
  > {
    const user = await prisma.user.findMany({
      where: {
        profile: {
          role: 'indicator',
        },
        ...where,
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            id: true,
            amountToReceive: true,
          },
        },
      },
    })

    return user
  }

  async mountSelectConsultant(
    where: Prisma.UserWhereInput,
  ): Promise<
    Omit<
      User & { profile: { id: string; amountToReceive: number | null } | null },
      'email' | 'password' | 'active'
    >[]
  > {
    const user = await prisma.user.findMany({
      where: {
        profile: {
          role: 'consultant',
        },
        ...where,
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            id: true,
            amountToReceive: true,
          },
        },
      },
    })

    return user
  }

  async countConsultant(where: Prisma.UserWhereInput): Promise<number> {
    const users = await prisma.user.count({
      where: {
        ...where,
      },
    })

    return users
  }

  async findManyConsultant(
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
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
            city: true,
            contractLink: true,
            contractSent: true,
            amountToReceive: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return userIndicator
  }

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
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
            city: true,
            contractLink: true,
            contractSent: true,
            amountToReceive: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return userIndicator
  }

  async findById(id: string): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null }) | null
  > {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
    if (!user) return null
    const { password: _pw, ...rest } = user
    return rest as Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null }
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
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
            city: true,
            contractLink: true,
            contractSent: true,
            amountToReceive: true,
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
