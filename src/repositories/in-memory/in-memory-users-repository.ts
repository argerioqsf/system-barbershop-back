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
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { UsersRepository } from '../users-repository'

export class InMemoryUserRepository implements UsersRepository {
  public items: (User & {
    profile:
      | (Profile & {
          role: Role
          permissions: Permission[]
          workHours: ProfileWorkHour[]
          blockedHours: ProfileBlockedHour[]
          barberServices: BarberService[]
        })
      | null
  })[] = []

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
    const user = this.items.find((item) => item.id === id)

    if (!user) {
      return null
    }

    const { profile, ...rest } = user

    return {
      ...rest,
      profile: profile
        ? {
            ...profile,
            permissions: profile.permissions ?? [],
          }
        : null,
    }
  }

  async findByEmail(email: string): Promise<
    | (User & {
        profile: (Profile & { role: Role; permissions: Permission[] }) | null
      })
    | null
  > {
    const user = this.items.find((item) => item.email === email)

    if (!user) {
      return null
    }

    return user
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = {
      id: `user-${this.items.length + 1}`,
      name: data.name,
      email: data.email,
      password: data.password,
      active: false,
      organizationId: data.organization.connect?.id ?? 'org-1',
      unitId: data.unit.connect?.id ?? 'unit-1',
      versionToken: 1,
      versionTokenInvalidate: null,
      createdAt: new Date(),
    }
    this.items.push({ ...user, profile: null })

    return user
  }

  async findMany(): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  > {
    return this.items.map(({ profile, ...rest }) => ({
      ...rest,
      profile: profile
        ? ({ ...profile, userId: undefined } as Omit<Profile, 'userId'>)
        : null,
    }))
  }

  async count(): Promise<number> {
    return this.items.length
  }

  async update(
    id: string,
    data: { unit: { connect: { id: string } } },
  ): Promise<
    Omit<User, 'password'> & {
      profile: (Profile & { role: Role; permissions: Permission[] }) | null
    }
  > {
    const index = this.items.findIndex((u) => u.id === id)
    if (index >= 0) {
      const current = this.items[index]
      const updated: User = { ...current }
      if (
        data.unit &&
        typeof data.unit === 'object' &&
        'connect' in data.unit
      ) {
        updated.unitId = data.unit.connect.id
      }
      this.items[index] = {
        ...updated,
        ...(data as Partial<User>),
        profile: null,
      }
      const { ...rest } = this.items[index]
      return rest
    }
    throw new UserNotFoundError()
  }
}
