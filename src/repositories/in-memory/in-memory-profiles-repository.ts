import { Prisma, Profile, Role } from '@prisma/client'
import crypto from 'node:crypto'
import { ProfilesRepository } from '../profiles-repository'

export class InMemoryProfilesRepository implements ProfilesRepository {
  public items: Profile[] = []

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const profile = {
      id: crypto.randomUUID(),
      role: Role.indicator,
      ...data,
    }
    this.items.push(profile)

    return profile
  }

  async findById(id: string): Promise<Profile | null> {
    return this.items.find((item) => item.id === id) ?? null
  }
}
