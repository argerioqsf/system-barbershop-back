import {
  BarberService,
  Permission,
  Prisma,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  User,
} from '@prisma/client'

export interface UsersRepository {
  findById(id: string): Promise<
    | (Omit<User, 'password'> & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
              barberServices: BarberService[]
            })
          | null
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
