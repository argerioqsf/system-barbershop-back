import { Prisma, Profile, User } from '@prisma/client'

export interface ProfilesRepository {
  findById(id: string): Promise<(Profile & { user: User }) | null>
  create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile>
  findByUserId(
    userId: string,
  ): Promise<
    (Omit<Profile, 'userId'> & { user: Omit<User, 'password'> }) | null
  >
  update(id: string, data: Prisma.ProfileUpdateInput): Promise<Profile>
}
