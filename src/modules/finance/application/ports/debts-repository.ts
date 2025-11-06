import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { Money } from '@/core/domain/value-objects/money'
import type { DebtStatus } from '@/modules/finance/domain/types/status'

export interface DebtRecord {
  id: string
  planId: string
  planProfileId: string
  amount: Money
  status: DebtStatus
  dueDate: Date
  paymentDate: Date | null
  createdAt: Date
}

export interface CreateDebtInput {
  planId: string
  planProfileId: string
  amount: Money
  status?: DebtStatus
  dueDate: Date
  paymentDate?: Date | null
  createdAt?: Date
}

export interface DebtQueryFilters {
  planId?: string
  planProfileId?: string
  status?: DebtStatus
  createdFrom?: Date
  createdTo?: Date
}

export interface DebtUpdateData {
  amount?: Money
  status?: DebtStatus
  paymentDate?: Date | null
  dueDate?: Date
}

export interface DebtPagination {
  page: number
  perPage: number
}

export interface DebtsRepositoryPort {
  create(data: CreateDebtInput, ctx?: TransactionClient): Promise<DebtRecord>

  findById(id: string, ctx?: TransactionClient): Promise<DebtRecord | null>

  findMany(
    filters?: DebtQueryFilters,
    pagination?: DebtPagination,
    ctx?: TransactionClient,
  ): Promise<DebtRecord[]>

  count(filters?: DebtQueryFilters, ctx?: TransactionClient): Promise<number>

  update(
    id: string,
    data: DebtUpdateData,
    ctx?: TransactionClient,
  ): Promise<DebtRecord>

  delete(id: string, ctx?: TransactionClient): Promise<void>
}
