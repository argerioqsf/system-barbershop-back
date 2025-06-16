import { Prisma, Profile, Role, User } from '@prisma/client'
import crypto from 'node:crypto'
import { ProfilesRepository } from '../profiles-repository'

export class InMemoryProfilesRepository implements ProfilesRepository {
  public items: (Profile & { user: Omit<User, 'password'> })[] = []

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const profile: Profile = {
      id: crypto.randomUUID(),
      phone: data.phone,
      cpf: data.cpf,
      genre: data.genre,
      birthday: data.birthday,
      pix: data.pix,
      role: data.role as Role,
      commissionPercentage: 100,
      totalBalance: 0,
      userId: data.userId,
      createdAt: new Date(),
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
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findByUserId(
    id: string,
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.items.find((item) => item.user.id === id) ?? null
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
    throw new Error('Profile not found')
  }

  async findMany(): Promise<(Profile & { user: Omit<User, 'password'> })[]> {
    return this.items
  }

  async incrementBalance(userId: string, amount: number): Promise<void> {
    const profile = this.items.find((item) => item.userId === userId)
    if (profile) {
      profile.totalBalance += amount
    }
  }
}
