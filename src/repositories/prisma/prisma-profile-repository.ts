import { prisma } from '@/lib/prisma'
import { Prisma, Profile } from '@prisma/client'
import { ProfilesRepository } from '../profiles-repository'

export class PrismaProfilesRepository implements ProfilesRepository {
  async findById(id: string): Promise<Profile | null> {
    const profile = await prisma.profile.findUnique({ where: { id } })

    return profile
  }

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const user = await prisma.profile.create({ data })

    return user
  }
}
