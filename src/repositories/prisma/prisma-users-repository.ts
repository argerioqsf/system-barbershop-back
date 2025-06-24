import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'
import {
  BarberService,
  Permission,
  Prisma,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  User,
} from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class PrismaUsersRepository implements UsersRepository {
  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<
    Omit<User, 'password'> & {
      profile: (Profile & { role: Role; permissions: Permission[] }) | null
    }
  > {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data,
      include: {
        profile: {
          include: {
            role: true,
            permissions: true,
          },
        },
      },
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
        versionToken: true,
        versionTokenInvalidate: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            roleId: true,
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

  async findById(id: string): Promise<
    | (Omit<User, 'password'> & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
              barberServices: BarberService[]
            })
          | null
      })
    | null
  > {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            role: true,
            permissions: true,
            workHours: true,
            blockedHours: true,
            barberServices: true,
          },
        },
      },
    })
    if (!user) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user
    return rest
  }

  async findByEmail(email: string): Promise<
    | (User & {
        profile: (Profile & { role: Role; permissions: Permission[] }) | null
      })
    | null
  > {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: { include: { role: true, permissions: true } },
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
        versionToken: true,
        versionTokenInvalidate: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            roleId: true,
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
