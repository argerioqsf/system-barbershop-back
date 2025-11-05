import { Money } from '@/core/domain/value-objects/money'

export type ListUserLoansDTO = string

export interface UserLoansSummary {
  pending: Array<{
    id: string
    amount: Money
    remaining: Money
    createdAt: Date
  }>
  paid: Array<{
    id: string
    amount: Money
    paidAt: Date
  }>
  totalOwed: Money
}
