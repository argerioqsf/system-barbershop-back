import {
  Permission,
  Prisma,
  Profile,
  ProfileWorkHour,
  ProfileBlockedHour,
  Role,
  Unit,
  User,
  BarberService,
  BarberProduct,
  PlanProfile,
} from '@prisma/client'

export type UserFindById =
  | (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            role: Role
            permissions: Permission[]
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
            barberProducts: BarberProduct[]
            plans: PlanProfile[]
          })
        | null
      unit: Unit | null
    })
  | null

export interface BarberUsersRepository {
  create(
    data: Prisma.UserCreateInput,
    profile: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
    permissionIds?: string[],
  ): Promise<{ user: Omit<User, 'password'>; profile: Profile }>
  update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUncheckedUpdateInput,
    permissionIds?: string[],
  ): Promise<{
    user: User
    profile: (Profile & { role: Role; permissions: Permission[] }) | null
  }>
  findMany(where?: Prisma.UserWhereInput): Promise<
    (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
          })
        | null
    })[]
  >
  findManyPaginated(
    where: Prisma.UserWhereInput,
    { page, perPage }: { page?: number; perPage?: number },
  ): Promise<{
    users: (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            role: Role
          })
        | null
    })[]
    count: number
  }>
  findById(id: string): Promise<UserFindById>
  findByEmail(email: string): Promise<
    | (Omit<User, 'password'> & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
            })
          | null
      })
    | null
  >
  delete(id: string): Promise<void>
}
