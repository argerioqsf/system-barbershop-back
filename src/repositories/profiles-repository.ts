import { Prisma, Profile, User } from '@prisma/client'

export interface ProfilesRepository {
  findById(id: string): Promise<(Profile & { user: User }) | null>
  create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile>
  findByUserId(userId: string): Promise<(Profile & { user: User }) | null>
}
