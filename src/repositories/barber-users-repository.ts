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
} from '@prisma/client'

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
  findById(id: string): Promise<
    | (User & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
              barberServices: BarberService[]
            })
          | null
        unit: Unit | null
      })
    | null
  >
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
