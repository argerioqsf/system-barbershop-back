import { UserToken } from '@/http/controllers/authenticate-controller'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { Prisma } from '@prisma/client'

interface ListTransactionsFilters {
  withCount?: boolean
  page?: number
  perPage?: number
}

interface ListTransactionsRequest {
  actor: UserToken
  filters: ListTransactionsFilters
}

export class ListTransactionsService {
  constructor(private repository: TransactionRepository) {}

  async execute({ actor, filters }: ListTransactionsRequest) {
    if (!actor || !actor.sub) throw new Error('User not found')

    const { page = 1, perPage = 10 } = filters

    let where: Prisma.TransactionWhereInput = {}

    where = { unitId: actor.unitId }

    const { items, count } = await this.repository.findMany(where, {
      page,
      perPage,
    })

    return {
      items,
      count,
      page,
      perPage,
    }
  }
}
