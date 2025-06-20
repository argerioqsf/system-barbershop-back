import { Prisma, Profile, Role, User } from '@prisma/client'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import crypto from 'node:crypto'
import { ProfilesRepository } from '../profiles-repository'

export class InMemoryProfilesRepository implements ProfilesRepository {
  public items: (Profile & { user: Omit<User, 'password'>; permissions?: { id: string; name?: string }[] })[] = []

  async create(
    data: Prisma.ProfileUncheckedCreateInput,
    permissionIds?: string[],
  ): Promise<Profile> {
    const profile: Profile = {
      id: crypto.randomUUID(),
      phone: data.phone,
      cpf: data.cpf,
      genre: data.genre,
      birthday: data.birthday,
      pix: data.pix,
      role: data.role as Role,
      roleModelId: (data as { roleModelId: string }).roleModelId,
      commissionPercentage: 100,
      totalBalance: 0,
      userId: data.userId,
      createdAt: new Date(),
    }
    if (permissionIds) {
      ;(profile as any).permissions = permissionIds.map((id) => ({ id, name: id }))
    }
    const user: Omit<User, 'password'> = {
      id: data.userId,
      name: '',
      email: '',
      active: false,
      organizationId: '',
      unitId: '',
      createdAt: new Date(),
    }
    this.items.push({ ...profile, user })
    return profile
  }

  async findById(
    id: string,
  ): Promise<
    (Profile & { user: Omit<User, 'password'>; permissions: { id: string; name?: string }[] }) | null
  > {
    return (this.items.find((item) => item.id === id) as any) ?? null
  }

  async findByUserId(
    id: string,
  ): Promise<
    (Profile & { user: Omit<User, 'password'>; permissions: { id: string; name?: string }[] }) | null
  > {
    return (this.items.find((item) => item.user.id === id) as any) ?? null
  }

  async update(
    id: string,
    data: Prisma.ProfileUncheckedUpdateInput,
  ): Promise<Profile> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        ...(data as unknown as Partial<Profile>),
      }
      return { ...this.items[index] }
    }
    throw new ProfileNotFoundError()
  }

  async findMany(): Promise<
    (Profile & { user: Omit<User, 'password'>; permissions?: { id: string; name?: string }[] })[]
  > {
    return this.items as any
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
