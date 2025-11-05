import { UserToken } from '@/http/controllers/authenticate-controller'
import { CashSessionRecord } from '../ports/cash-register-repository'
import { TransactionRecord } from '../ports/transactions-repository'
import { DetailedSale } from '@/repositories/sale-repository'

export interface ListCashSessionsDTO {
  actor: UserToken
}

export interface CashSessionPayload {
  id: string
  unitId: string
  openedById: string
  openedAt: Date
  closedAt: Date | null
  initialAmount: number
  finalAmount: number
  user?: CashSessionRecord['user']
  unit?: CashSessionRecord['unit']
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: number
  }>
  transactions: Array<Omit<TransactionRecord, 'amount'> & { amount: number }>
  sales: DetailedSale[]
}

export interface ListCashSessionsOutput {
  sessions: Array<CashSessionPayload>
}
