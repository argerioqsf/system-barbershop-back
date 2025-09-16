import {
  Prisma,
  Profile,
  Unit,
  User,
  ProfileWorkHour,
  ProfileBlockedHour,
} from '@prisma/client'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import crypto from 'node:crypto'
import { ProfilesRepository } from '../profiles-repository'

export class InMemoryProfilesRepository implements ProfilesRepository {
  public items: (Profile & {
    user: Omit<User, 'password'> & { unit: Unit }
    permissions: { id: string; name: string }[]
    workHours: ProfileWorkHour[]
    blockedHours: ProfileBlockedHour[]
  })[] = []

  async create(
    data: Prisma.ProfileUncheckedCreateInput,
    permissionIds?: string[],
  ): Promise<Profile> {
    const profile: Profile & {
      permissions: { id: string; name: string }[]
    } = {
      id: crypto.randomUUID(),
      phone: data.phone,
      cpf: data.cpf,
      genre: data.genre,
      birthday: data.birthday,
      pix: data.pix,
      roleId: (data as { roleId: string }).roleId,
      commissionPercentage: data.commissionPercentage ?? 0,
      totalBalance: 0,
      userId: data.userId,
      createdAt: new Date(),
      permissions: permissionIds?.map((id) => ({ id, name: id })) ?? [],
    }
    const user: Omit<User, 'password'> & { unit: Unit } = {
      id: data.userId,
      name: '',
      email: '',
      active: false,
      organizationId: '',
      unitId: '',
      versionToken: 1,
      versionTokenInvalidate: null,
      createdAt: new Date(),
      unit: {
        allowsLoan: true,
        id: 'unit-1',
        name: '',
        organizationId: '',
        loanMonthlyLimit: 0,
        slotDuration: 30,
        appointmentFutureLimitDays: 7,
        slug: '',
        totalBalance: 0,
      },
    }
    this.items.push({
      ...profile,
      user,
      workHours: [],
      blockedHours: [],
    })
    return profile
  }

  async findById(
    id: string,
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<
    | (Profile & {
        user: Omit<User, 'password'>
        permissions: { id: string; name: string }[]
      })
    | null
  > {
    const profile = this.items.find((item) => item.id === id)
    return profile ?? null
  }

  async findByUserId(id: string): Promise<
    | (Profile & {
        user: Omit<User, 'password'> & { unit: Unit }
        permissions: { id: string; name: string }[]
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
      })
    | null
  > {
    const profile = this.items.find((item) => item.user.id === id)
    return profile ?? null
  }

  async update(
    id: string,
    data: Prisma.ProfileUncheckedUpdateInput,
  ): Promise<Profile> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        ...(data as Partial<Profile>),
      }
      return { ...this.items[index] }
    }
    throw new ProfileNotFoundError()
  }

  async findMany(): Promise<
    (Profile & {
      user: Omit<User, 'password'>
      permissions: { id: string; name: string }[]
    })[]
  > {
    return this.items
  }

  async incrementBalance(
    userId: string,
    amount: number,
  ): Promise<Profile & { user: Omit<User, 'password'> }> {
    const profile = this.items.find((item) => item.userId === userId)
    if (profile) {
      profile.totalBalance += amount
      return profile
    }
    throw new ProfileNotFoundError()
  }
}
