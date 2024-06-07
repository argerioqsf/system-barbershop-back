import { Organization, Prisma, Profile, Unit, User } from '@prisma/client'

export interface UsersRepository {
  findById(id: string): Promise<
    | (Omit<User, 'password'> & {
        profile: Omit<Profile & { units: { unit: Unit }[] }, 'userId'> | null
        organizations: { organization: Organization }[]
      })
    | null
  >
  findByEmail(email: string): Promise<User | null>
  create(data: Prisma.UserCreateInput): Promise<User>
  findMany(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  >
  count(where: Prisma.UserWhereInput): Promise<number>
  findManyIndicator(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  >

  findManyConsultant(
    page: number,
    where: Prisma.UserWhereInput,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  >

  countIndicator(where: Prisma.UserWhereInput): Promise<number>

  countConsultant(where: Prisma.UserWhereInput): Promise<number>

  update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'password'>>

  mountSelectConsultant(): Promise<
    Omit<User, 'email' | 'password' | 'active'>[]
  >

  mountSelectIndicator(): Promise<Omit<User, 'email' | 'password' | 'active'>[]>
}
