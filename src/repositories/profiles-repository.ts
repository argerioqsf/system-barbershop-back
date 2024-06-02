import {
  ExtractProfile,
  Organization,
  Prisma,
  Profile,
  Unit,
  User,
} from '@prisma/client'

export interface ProfilesRepository {
  findById(id: string): Promise<(Profile & { user: User }) | null>
  create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile>
  findByUserId(userId: string): Promise<
    | (Omit<Profile, 'userId'> & {
        extract_profile: ExtractProfile[]
        user: Omit<
          User & { organizations: { organization: Organization }[] },
          'password'
        >
      } & {
        units: { unit: Unit }[]
      })
    | null
  >
  update(id: string, data: Prisma.ProfileUncheckedUpdateInput): Promise<Profile>
}
