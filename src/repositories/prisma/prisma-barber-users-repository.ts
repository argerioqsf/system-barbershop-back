import { prisma } from '@/lib/prisma'
import {
  Permission,
  Prisma,
  Profile,
  ProfileWorkHour,
  ProfileBlockedHour,
  Role,
  User,
} from '@prisma/client'
import { BarberUsersRepository, UserFindById } from '../barber-users-repository'

export class PrismaBarberUsersRepository implements BarberUsersRepository {
  private sanitizeUser<T extends { password: string }>(
    user: T,
  ): Omit<T, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user
    return safeUser
  }

  private sanitizeUsers<T extends { password: string }>(
    users: T[],
  ): Omit<T, 'password'>[] {
    return users.map((user) => this.sanitizeUser(user))
  }

  async create(
    data: Prisma.UserCreateInput,
    profileData: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
    permissionIds?: string[],
  ): Promise<{ user: Omit<User, 'password'>; profile: Profile }> {
    const user = await prisma.user.create({ data })
    const profile = await prisma.profile.create({
      data: {
        ...profileData,
        userId: user.id,
        ...(permissionIds && {
          permissions: { connect: permissionIds.map((id) => ({ id })) },
        }),
      },
    })
    return { user: this.sanitizeUser(user), profile }
  }

  async update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
    permissionIds?: string[],
  ): Promise<{
    user: User
    profile:
      | (Profile & {
          role: Role
          permissions: Permission[]
          workHours: ProfileWorkHour[]
          blockedHours: ProfileBlockedHour[]
        })
      | null
  }> {
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
      include: {
        profile: {
          include: {
            role: true,
            permissions: true,
            workHours: true,
            blockedHours: true,
          },
        },
      },
    })

    return { user, profile: user.profile }
  }

  async findMany(where: Prisma.UserWhereInput = {}): Promise<
    (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
          })
        | null
    })[]
  > {
    const users = await prisma.user.findMany({
      where,
      include: {
        profile: {
          include: {
            barberServices: true,
            barberProducts: true,
            workHours: true,
            blockedHours: true,
          },
        },
      },
    })
    return this.sanitizeUsers<
      User & {
        profile:
          | (Profile & {
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
            })
          | null
          | (Profile & {
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
            })
          | null
      }
    >(users)
  }

  async findManyPaginated(
    where: Prisma.UserWhereInput,
    { page = 1, perPage = 10 }: { page?: number; perPage?: number },
  ) {
    const [users, count] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          profile: {
            include: {
              workHours: true,
              blockedHours: true,
              role: true,
            },
          },
        },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: this.sanitizeUsers(users),
      count,
    }
  }

  async findById(id: string): Promise<UserFindById> {
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
            barberProducts: true,
            plans: true,
          },
        },
        unit: true,
      },
    })
    return user ? this.sanitizeUser(user) : null
  }

  async findByEmail(email: string): Promise<
    | (Omit<User, 'password'> & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
            })
          | null
      })
    | null
  > {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        profile: {
          include: {
            role: true,
            permissions: true,
            workHours: true,
            blockedHours: true,
          },
        },
      },
    })
    return user ? this.sanitizeUser(user) : null
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }
}
