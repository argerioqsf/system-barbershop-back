import { prisma } from '@/lib/prisma'
import { ExtractProfile, Prisma } from '@prisma/client'
import { ExtractProfileRepository } from '../extract-profile-repository'

export class PrismaExtractProfileRepository
  implements ExtractProfileRepository
{
  async create(
    data: Prisma.ExtractProfileUncheckedCreateInput,
  ): Promise<ExtractProfile> {
    const extract = await prisma.extractProfile.create({ data })

    return extract
  }
}
