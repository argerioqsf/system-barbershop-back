import { TransactionRepository } from '@/repositories/transaction-repository'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { Money } from '@/core/domain/value-objects/money'
import { Prisma } from '@prisma/client'
import { ListTransactionsQueryInput } from '../dto/list-transactions.dto'

export class ListTransactionsQuery {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute({ actor, filters = {} }: ListTransactionsQueryInput) {
    if (!actor || !actor.sub) {
      throw new UserNotFoundError()
    }

    const { page = 1, perPage = 10 } = filters

    let where: Prisma.TransactionWhereInput = {}

    where = { unitId: actor.unitId }

    const { items, count } = await this.transactionRepository.findMany(where, {
      page,
      perPage,
    })

    const normalizedItems = items.map((item) => ({
      ...item,
      amount: Money.from(item.amount).toNumber(),
    }))

    return {
      items: normalizedItems,
      count,
      page,
      perPage,
    }
  }
}
