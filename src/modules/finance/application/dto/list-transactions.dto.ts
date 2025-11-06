import { UserToken } from '@/http/controllers/authenticate-controller'

export interface ListTransactionsFilters {
  withCount?: boolean
  page?: number
  perPage?: number
}

export interface ListTransactionsQueryInput {
  actor: UserToken
  filters?: ListTransactionsFilters
}
