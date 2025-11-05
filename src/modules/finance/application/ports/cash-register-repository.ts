import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { Money } from '@/core/domain/value-objects/money'

export interface CashSessionRecord {
  id: string
  unitId: string
  openedByUserId: string
  openedAt: Date
  closedAt: Date | null
  openingAmount: Money
  finalAmount: Money
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: Money
  }>
  user?: {
    id: string
    name: string
    email: string
    unitId: string
    organizationId?: string | null
  }
  unit?: {
    organizationId?: string
  }
}

export interface CreateCashSessionInput {
  unitId: string
  openedByUserId: string
  openedAt?: Date
  openingAmount: Money
  finalAmount?: Money
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: Money
  }>
}

export interface CashSessionFilters {
  unitId?: string
  organizationId?: string
}

export interface CashRegisterRepositoryPort {
  create(
    data: CreateCashSessionInput,
    tx?: TransactionClient,
  ): Promise<CashSessionRecord>

  close(
    id: string,
    finalAmount: Money,
    closedAt: Date,
    tx?: TransactionClient,
  ): Promise<CashSessionRecord>

  findOpenByUnit(
    unitId: string,
    tx?: TransactionClient,
  ): Promise<CashSessionRecord | null>

  findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<CashSessionRecord | null>

  findMany(
    filters: CashSessionFilters,
    tx?: TransactionClient,
  ): Promise<CashSessionRecord[]>

  incrementFinalAmount(
    sessionId: string,
    amount: Money,
    tx?: TransactionClient,
  ): Promise<void>
}
