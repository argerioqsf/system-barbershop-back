import { Prisma, Profile, Unit, User } from '@prisma/client'

export interface BarberUsersRepository {
  create(
    data: Prisma.UserCreateInput,
    profile: Prisma.ProfileCreateInput,
  ): Promise<{ user: User; profile: Profile }>
  findMany(): Promise<(User & { profile: Profile | null })[]>
  findById(
    id: string,
  ): Promise<(User & { profile: Profile | null; unit: Unit | null }) | null>
  findByEmail(email: string): Promise<User | null>
  delete(id: string): Promise<void>
}
