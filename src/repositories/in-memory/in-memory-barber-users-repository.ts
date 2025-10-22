import {
  Permission,
  PermissionName,
  PermissionCategory,
  Prisma,
  Profile,
  ProfileWorkHour,
  ProfileBlockedHour,
  Role,
  Unit,
  User,
  BarberService,
  BarberProduct,
  PlanProfile,
} from '@prisma/client'
import { BarberUsersRepository } from '../barber-users-repository'
import { randomUUID } from 'crypto'

export class InMemoryBarberUsersRepository implements BarberUsersRepository {
  constructor(
    public users: (User & {
      profile:
        | (Profile & {
            permissions: Permission[]
            role: Role
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
            barberProducts: BarberProduct[]
            plans: PlanProfile[]
          })
        | null
      unit?: Unit | null
    })[] = [],
  ) {}

  async create(
    data: Prisma.UserCreateInput,
    profileData: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
    permissionIds?: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<{ user: Omit<User, 'password'>; profile: Profile }> {
    const user: User = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password as string,
      active: (data.active as boolean) ?? false,
      organizationId: (data.organization as { connect: { id: string } }).connect
        .id,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      versionToken: 1,
      versionTokenInvalidate: null,
      createdAt: new Date(),
    }
    const profile: Profile & {
      permissions: Permission[]
      role: Role
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
      barberProducts: BarberProduct[]
      plans: PlanProfile[]
    } = {
      id: randomUUID(),
      userId: user.id,
      phone: profileData.phone as string,
      cpf: profileData.cpf as string,
      genre: profileData.genre as string,
      birthday: profileData.birthday as string,
      pix: profileData.pix as string,
      roleId: (profileData as { roleId: string }).roleId,
      role: {
        id: (profileData as { roleId: string }).roleId,
        name: 'ADMIN',
        unitId: randomUUID(),
      },
      commissionPercentage:
        (profileData as { commissionPercentage?: number })
          .commissionPercentage ?? 100,
      totalBalance: 0,
      createdAt: new Date(),
      permissions:
        permissionIds?.map((id) => ({
          id,
          name: 'LIST_APPOINTMENTS_UNIT',
          category: 'USER',
          unitId: randomUUID(),
        })) ?? [],
      workHours: [],
      blockedHours: [],
      barberServices: [],
      barberProducts: [],
      plans: [],
    }
    this.users.push({
      ...user,
      profile,
      unit: {
        id: user.unitId,
        name: '',
        slug: '',
        organizationId: user.organizationId,
        totalBalance: 0,
        allowsLoan: false,
        loanMonthlyLimit: 0,
        slotDuration: 60,
        appointmentFutureLimitDays: 7,
      },
    })
    const rest = { ...user }
    delete (rest as { password?: string }).password
    return { user: rest, profile }
  }

  async update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
    permissionIds?: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
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
    const index = this.users.findIndex((u) => u.id === id)
    if (index < 0) throw new Error('User not found')
    const current = this.users[index]
    const updatedUser: User = { ...current }
    if (userData.name) updatedUser.name = userData.name as string
    if (userData.email) updatedUser.email = userData.email as string
    if ('active' in userData && typeof userData.active === 'boolean')
      updatedUser.active = userData.active
    if (userData.unit && 'connect' in userData.unit) {
      updatedUser.unitId = (
        userData.unit as { connect: { id: string } }
      ).connect.id
    }

    const profile = current.profile
    if (profile) {
      if (profileData.phone) profile.phone = profileData.phone as string
      if (profileData.cpf) profile.cpf = profileData.cpf as string
      if (profileData.genre) profile.genre = profileData.genre as string
      if (profileData.birthday)
        profile.birthday = profileData.birthday as string
      if (profileData.pix) profile.pix = profileData.pix as string
      if ('roleId' in profileData)
        profile.roleId = (profileData as { roleId: string }).roleId
      if (
        'commissionPercentage' in profileData &&
        profileData.commissionPercentage !== undefined
      )
        profile.commissionPercentage =
          profileData.commissionPercentage as number
      if (permissionIds !== undefined) {
        profile.permissions = permissionIds.map((id) => ({
          id,
          name: 'LIST_APPOINTMENTS_UNIT' as PermissionName,
          category: 'USER' as PermissionCategory,
          unitId: randomUUID() as string,
        }))
      }
    }
    this.users[index] = { ...current, ...updatedUser, profile }
    return { user: updatedUser, profile }
  }

  async findMany(where: Prisma.UserWhereInput = {}): Promise<
    (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            permissions: Permission[]
            role: Role
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
          })
        | null
    })[]
  > {
    return this.users
      .filter((u) => {
        if (where.unitId && u.unit?.id !== where.unitId) return false
        if (where.organizationId && u.organizationId !== where.organizationId)
          return false
        if (
          where.unit &&
          typeof where.unit === 'object' &&
          'organizationId' in where.unit &&
          u.unit?.organizationId !==
            (where.unit as { organizationId: string }).organizationId
        )
          return false
        if (
          where.profile &&
          typeof where.profile === 'object' &&
          'permissions' in where.profile &&
          (
            where.profile as {
              permissions?: { some?: { name?: PermissionName } }
            }
          ).permissions?.some?.name
        ) {
          const perm = (
            where.profile as { permissions: { some: { name: PermissionName } } }
          ).permissions.some.name
          return u.profile?.permissions.some((p) => p.name === perm)
        }
        return true
      })
      .map((u) => {
        const rest = { ...u }
        delete (rest as { password?: string }).password
        return rest
      })
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
              barberProducts: BarberProduct[]
              plans: PlanProfile[]
            })
          | null
        unit: Unit | null
      })
    | null
  > {
    const user = this.users.find((u) => u.id === id)
    if (!user) return null
    const rest = { ...user }
    delete (rest as { password?: string }).password
    return { ...rest, unit: user.unit ?? null }
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
    const user = this.users.find((u) => u.email === email)
    if (!user) return null
    const rest = { ...user }
    delete (rest as { password?: string }).password
    return rest
  }

  async findManyPaginated(
    where: Prisma.UserWhereInput = {},
    { page = 1, perPage = 10 }: { page?: number; perPage?: number },
  ) {
    const allUsers = this.users.filter((u) => {
      if (where.unitId && u.unit?.id !== where.unitId) return false
      if (where.organizationId && u.organizationId !== where.organizationId) {
        return false
      }
      if (
        where.unit &&
        typeof where.unit === 'object' &&
        'organizationId' in where.unit &&
        u.unit?.organizationId !==
          (where.unit as { organizationId: string }).organizationId
      ) {
        return false
      }

      if (
        where.name &&
        typeof where.name === 'object' &&
        'contains' in where.name
      ) {
        const searchTerm = (
          where.name as { contains: string }
        ).contains.toLowerCase()
        if (!u.name.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      if (
        where.profile &&
        typeof where.profile === 'object' &&
        'permissions' in where.profile &&
        (
          where.profile as {
            permissions?: { some?: { name?: PermissionName } }
          }
        ).permissions?.some?.name
      ) {
        const perm = (
          where.profile as { permissions: { some: { name: PermissionName } } }
        ).permissions.some.name
        return u.profile?.permissions.some((p) => p.name === perm)
      }
      return true
    })

    const count = allUsers.length
    const paginatedUsers = allUsers.slice((page - 1) * perPage, page * perPage)

    const sanitizedUsers = paginatedUsers.map((u) => {
      const rest = { ...u }
      delete (rest as { password?: string }).password
      return rest
    })

    return {
      users: sanitizedUsers,
      count,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(id: string, _tx?: Prisma.TransactionClient): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id)
  }
}
