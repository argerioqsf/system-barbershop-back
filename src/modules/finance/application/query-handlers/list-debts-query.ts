import { DebtsRepositoryPort } from '../ports/debts-repository'
import {
  ListDebtsQueryInput,
  ListDebtsQueryOutput,
} from '../dto/list-debts.dto'

export class ListDebtsQuery {
  constructor(private readonly debtsRepository: DebtsRepositoryPort) {}

  async execute(input: ListDebtsQueryInput): Promise<ListDebtsQueryOutput> {
    const page = input.pagination?.page ?? 1
    const perPage = input.pagination?.perPage ?? 10

    // TODO: Add logic to scope the query based on actor permissions
    const { withCount, ...filters } = input.filters

    const items = await this.debtsRepository.findMany(filters, {
      page,
      perPage,
    })

    let count = 0
    if (withCount) {
      count = await this.debtsRepository.count(filters)
    }

    const normalizedItems = items.map((item) => ({
      ...item,
      amount: item.amount.toNumber(),
    }))

    return { items: normalizedItems, count, page, perPage }
  }
}
