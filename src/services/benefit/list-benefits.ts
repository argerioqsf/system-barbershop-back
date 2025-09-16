import { UserToken } from '@/http/controllers/authenticate-controller'
import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit, Prisma } from '@prisma/client'

export class ListBenefitsService {
  constructor(private repository: BenefitRepository) {}

  async execute(
    user: UserToken,
    params: {
      name?: string
      page?: number
      perPage?: number
      withCount?: boolean
    } = {},
  ): Promise<{
    items: Benefit[]
    count: number
    page: number
    perPage: number
  }> {
    const where: Prisma.BenefitWhereInput = {
      unitId: user.unitId,
      ...(params.name ? { name: { contains: params.name } } : {}),
    }
    const { page, perPage, withCount } = params
    if (page && perPage) {
      const { items, count } = await this.repository.findManyPaginated(
        where,
        page,
        perPage,
      )
      return {
        items,
        count: withCount ? count : 0,
        page: withCount ? page : 0,
        perPage: withCount ? perPage : 0,
      }
    }
    const benefits = await this.repository.findMany(where)
    return {
      items: benefits,
      count: withCount ? benefits.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? benefits.length : 0,
    }
  }
}
