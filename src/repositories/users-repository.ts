import { Permission, Prisma, Profile, Role, User } from '@prisma/client'

export interface UsersRepository {
  findById(id: string): Promise<
    | (Omit<User, 'password'> & {
        profile: (Profile & { role: Role; permissions: Permission[] }) | null
      })
    | null
  >
  findByEmail(email: string): Promise<
    | (User & {
        profile: (Profile & { role: Role; permissions: Permission[] }) | null
      })
    | null
  >
  create(data: Prisma.UserCreateInput): Promise<User>
  findMany(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  >
  count(where: Prisma.UserWhereInput): Promise<number>
  update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<
    Omit<User, 'password'> & {
      profile: (Profile & { role: Role; permissions: Permission[] }) | null
    }
  >
}
