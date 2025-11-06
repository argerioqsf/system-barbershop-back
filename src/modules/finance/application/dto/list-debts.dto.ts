import { UserToken } from '@/http/controllers/authenticate-controller'
import { DebtQueryFilters, DebtPagination } from '../ports/debts-repository'

export interface ListDebtsQueryInput {
  actor: UserToken
  filters: DebtQueryFilters & { withCount?: boolean }
  pagination?: DebtPagination
}

export interface ListDebtsQueryOutputItem {
  id: string
  planId: string
  planProfileId: string
  status: 'PAID' | 'PENDING'
  dueDate: Date
  paymentDate: Date | null
  createdAt: Date
  amount: number
}

export interface ListDebtsQueryOutput {
  items: ListDebtsQueryOutputItem[]
  count: number
  page: number
  perPage: number
}
