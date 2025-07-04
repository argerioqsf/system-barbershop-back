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
} from '@prisma/client'

export type UserFindById =
  | (User & {
      profile:
        | (Profile & {
            role: Role
            permissions: Permission[]
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
            barberProducts: BarberProduct[]
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
  ): Promise<{ user: User; profile: Profile }>
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
  findById(id: string): Promise<UserFindById>
  findByEmail(email: string): Promise<
    | (User & {
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
