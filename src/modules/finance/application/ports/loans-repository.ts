import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { Money } from '@/core/domain/value-objects/money'
import type { LoanStatus } from '@/modules/finance/domain/types/status'

export interface LoanTransactionRecord {
  id: string
  amount: Money
  createdAt: Date
}

export interface LoanRecord {
  id: string
  unitId: string
  userId: string
  sessionId: string
  amount: Money
  status: LoanStatus
  createdAt: Date
  paidAt: Date | null
  updatedById: string | null
}

export interface LoanWithTransactionsRecord extends LoanRecord {
  transactions: LoanTransactionRecord[]
}

export interface LoanQueryFilters {
  userId?: string
  unitId?: string
  status?: LoanStatus
}

export interface LoanUpdateData {
  status?: LoanStatus
  paidAt?: Date | null
  updatedById?: string | null
}

export interface CreateLoanInput {
  unitId: string
  userId: string
  sessionId: string
  amount: Money
  status?: LoanStatus
  createdAt?: Date
  paidAt?: Date | null
  updatedById?: string | null
}

export interface LoansRepositoryPort {
  create(data: CreateLoanInput, ctx?: TransactionClient): Promise<LoanRecord>

  findById(
    id: string,
    ctx?: TransactionClient,
  ): Promise<LoanWithTransactionsRecord | null>

  findMany(
    filters?: LoanQueryFilters,
    ctx?: TransactionClient,
  ): Promise<LoanWithTransactionsRecord[]>

  update(
    id: string,
    data: LoanUpdateData,
    ctx?: TransactionClient,
  ): Promise<LoanRecord>
}
