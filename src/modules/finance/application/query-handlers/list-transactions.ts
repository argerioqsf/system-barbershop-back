import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { Money } from '@/core/domain/value-objects/money'
import { ListTransactionsQueryInput } from '../dto/list-transactions.dto'
import {
  TransactionReadRepository,
  TransactionReadFilter,
} from '@/modules/finance/application/ports/transaction-read-repository'

export class ListTransactionsQuery {
  constructor(
    private readonly transactionRepository: TransactionReadRepository,
  ) {}

  async execute({ actor, filters = {} }: ListTransactionsQueryInput) {
    if (!actor || !actor.sub) {
      throw new UserNotFoundError()
    }

    const { page = 1, perPage = 10 } = filters

    const filter: TransactionReadFilter = {
      unitId: actor.unitId,
    }

    const { items, count } = await this.transactionRepository.findMany(filter, {
      page,
      perPage,
    })

    const normalizedItems = items.map((item) => ({
      ...item,
      amount: Money.from(Number(item.amount)).toNumber(),
    }))

    return {
      items: normalizedItems,
      count,
      page,
      perPage,
    }
  }
}
