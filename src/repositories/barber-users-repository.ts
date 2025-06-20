import { Prisma, Profile, Unit, User } from '@prisma/client'

export interface BarberUsersRepository {
  create(
    data: Prisma.UserCreateInput,
    profile: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
    permissionIds?: string[],
  ): Promise<{ user: User; profile: Profile }>
  update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
    permissionIds?: string[],
  ): Promise<{ user: User; profile: Profile | null }>
  findMany(
    where?: Prisma.UserWhereInput,
  ): Promise<(User & { profile: Profile | null })[]>
  findById(
    id: string,
  ): Promise<(User & { profile: Profile | null; unit: Unit | null }) | null>
  findByEmail(email: string): Promise<User | null>
  delete(id: string): Promise<void>
}
