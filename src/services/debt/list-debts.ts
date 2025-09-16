import { DebtRepository } from '@/repositories/debt-repository'
import { PaymentStatus, Debt, Prisma } from '@prisma/client'

export class ListDebtsService {
  constructor(private repository: DebtRepository) {}

  async execute(
    params: {
      status?: PaymentStatus
      planId?: string
      planProfileId?: string
      from?: Date
      to?: Date
      page?: number
      perPage?: number
      withCount?: boolean
    } = {},
  ): Promise<{ items: Debt[]; count: number; page: number; perPage: number }> {
    const where: Prisma.DebtWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.planId ? { planId: params.planId } : {}),
      ...(params.planProfileId ? { planProfileId: params.planProfileId } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
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
    const debts = await this.repository.findMany(where)
    return {
      items: debts,
      count: withCount ? debts.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? debts.length : 0,
    }
  }
}
