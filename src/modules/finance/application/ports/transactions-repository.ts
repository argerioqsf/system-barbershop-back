import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { Money } from '@/core/domain/value-objects/money'
import type {
  TransactionReason,
  TransactionType,
} from '@/modules/finance/domain/entities/transaction'

export type {
  TransactionReason as PortTransactionReason,
  TransactionType as PortTransactionType,
} from '@/modules/finance/domain/entities/transaction'

export interface TransactionRecord {
  id: string
  amount: Money
  reason: TransactionReason
  description?: string | null
  createdAt: Date
  type: TransactionType
  isLoan: boolean
  userId: string
  affectedUserId?: string | null
  saleId?: string | null
  saleItemId?: string | null
  sessionId?: string | null
  unitId?: string | null
  loanId?: string | null
  appointmentServiceId?: string | null
  receiptUrl?: string | null
}

export interface CreateTransactionInput {
  amount: Money
  reason: TransactionReason
  description?: string | null
  userId: string
  affectedUserId?: string | null
  saleId?: string | null
  saleItemId?: string | null
  unitId?: string | null
  sessionId?: string | null
  loanId?: string | null
  appointmentServiceId?: string | null
  receiptUrl?: string | null
  isLoan?: boolean
}

export interface TransactionsRepository {
  create(
    data: CreateTransactionInput,
    ctx?: TransactionClient,
  ): Promise<TransactionRecord>

  findManyByUser(
    userId: string,
    ctx?: TransactionClient,
  ): Promise<TransactionRecord[]>

  findManyBySession(
    sessionId: string,
    ctx?: TransactionClient,
  ): Promise<TransactionRecord[]>
}
