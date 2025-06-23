import { prisma } from '@/lib/prisma'
import {
  Permission,
  Prisma,
  Profile,
  ProfileWorkHour,
  ProfileBlockedHour,
  Role,
  Unit,
  User,
} from '@prisma/client'
import { BarberUsersRepository } from '../barber-users-repository'

export class PrismaBarberUsersRepository implements BarberUsersRepository {
  private sanitizeUser<T>(user: T & { password: string }): Omit<T, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user
    return safeUser
  }

  private sanitizeUsers<T>(
    users: (T & { password: string })[],
  ): Omit<T, 'password'>[] {
    return users.map((user) => this.sanitizeUser(user))
  }

  async create(
    data: Prisma.UserCreateInput,
    profileData: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
    permissionIds?: string[],
  ): Promise<{ user: User; profile: Profile }> {
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
    return { user, profile }
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
      }
    >(users)
  }

  async findById(id: string): Promise<
    | (User & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
            })
          | null
        unit: Unit | null
      })
    | null
  > {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            role: true,
            permissions: true,
            workHours: true,
            blockedHours: true,
          },
        },
        unit: true,
      },
    })
  }

  async findByEmail(email: string): Promise<
    | (User & {
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
    return prisma.user.findUnique({
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
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }
}
