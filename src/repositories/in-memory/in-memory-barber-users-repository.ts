import { Prisma, Profile, Unit, User, Role } from '@prisma/client'
import { BarberUsersRepository } from '../barber-users-repository'
import { randomUUID } from 'crypto'

export class InMemoryBarberUsersRepository implements BarberUsersRepository {
  constructor(
    public users: (User & {
      profile: Profile | null
      unit?: Unit | null
    })[] = [],
  ) {}

  async create(
    data: Prisma.UserCreateInput,
    profileData: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
  ): Promise<{ user: User; profile: Profile }> {
    const user: User = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password as string,
      active: (data.active as boolean) ?? false,
      organizationId: (data.organization as { connect: { id: string } }).connect
        .id,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      createdAt: new Date(),
    }
    const profile: Profile = {
      id: randomUUID(),
      userId: user.id,
      phone: profileData.phone as string,
      cpf: profileData.cpf as string,
      genre: profileData.genre as string,
      birthday: profileData.birthday as string,
      pix: profileData.pix as string,
      role: profileData.role as Role,
      roleModelId: (profileData as { roleModelId: string }).roleModelId,
      commissionPercentage:
        (profileData as { commissionPercentage?: number })
          .commissionPercentage ?? 100,
      totalBalance: 0,
      createdAt: new Date(),
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
      },
    })
    return { user, profile }
  }

  async update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
  ): Promise<{ user: User; profile: Profile | null }> {
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
      if (profileData.role) profile.role = profileData.role as Role
      if ('roleModelId' in profileData)
        profile.roleModelId = (profileData as { roleModelId: string }).roleModelId
      if (
        'commissionPercentage' in profileData &&
        profileData.commissionPercentage !== undefined
      )
        profile.commissionPercentage =
          profileData.commissionPercentage as number
    }
    this.users[index] = { ...current, ...updatedUser, profile }
    return { user: updatedUser, profile }
  }

  async findMany(
    where: Prisma.UserWhereInput = {},
  ): Promise<(User & { profile: Profile | null })[]> {
    return this.users.filter((u) => {
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
      return true
    })
  }

  async findById(
    id: string,
  ): Promise<(User & { profile: Profile | null; unit: Unit | null }) | null> {
    const user = this.users.find((u) => u.id === id)
    if (!user) return null
    return { ...user, unit: user.unit ?? null }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email)
    return user ?? null
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id)
  }
}
