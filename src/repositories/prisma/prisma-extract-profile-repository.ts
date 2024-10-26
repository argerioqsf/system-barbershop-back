import { prisma } from '@/lib/prisma'
import { ExtractProfile, Prisma } from '@prisma/client'
import { ExtractProfileRepository } from '../extract-profile-repository'

export class PrismaExtractProfileRepository
  implements ExtractProfileRepository
{
  async addAmountReceive(where: Prisma.ExtractProfileWhereInput): Promise<{
    _sum: { amount_receive: number | null }
  }> {
    const user = await prisma.extractProfile.aggregate({
      where: {
        ...where,
      },
      _sum: {
        amount_receive: true,
      },
    })

    return user
  }

  async create(
    data: Prisma.ExtractProfileUncheckedCreateInput,
  ): Promise<ExtractProfile> {
    const extract = await prisma.extractProfile.create({ data })

    return extract
  }
}
