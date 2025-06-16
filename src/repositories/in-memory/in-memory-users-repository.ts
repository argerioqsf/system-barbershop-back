import { Prisma, Profile, User } from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class InMemoryUserRepository implements UsersRepository {
  public items: (User & { profile: Profile | null })[] = []

  async findById(
    id: string,
  ): Promise<(Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null }) | null> {
    const user = this.items.find((item) => item.id === id)

    if (!user) {
      return null
    }

    const { password: _pw, profile, ...rest } = user

    return { ...rest, profile: profile ? { ...profile, userId: undefined } as Omit<Profile, 'userId'> : null }
  }

  async findByEmail(email: string): Promise<(User & { profile: Profile | null }) | null> {
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
      createdAt: new Date(),
    }
    this.items.push({ ...user, profile: null })

    return user
  }

  async findMany(
    _page: number,
    _where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  > {
    return this.items.map(({ password: _pw, profile, ...rest }) => ({
      ...rest,
      profile: profile ? ({ ...profile, userId: undefined } as Omit<Profile, 'userId'>) : null,
    }))
  }

  async count(_where: Prisma.UserWhereInput): Promise<number> {
    return this.items.length
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<Omit<User, 'password'>> {
    const index = this.items.findIndex((u) => u.id === id)
    if (index >= 0) {
      const current = this.items[index]
      this.items[index] = {
        ...current,
        ...(data as unknown as Partial<User>),
      }
      const { password: _pw, profile, ...rest } = this.items[index]
      return rest
    }
    throw new Error('User not found')
  }
}
