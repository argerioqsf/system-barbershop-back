import { Money } from '@/core/domain/value-objects/money'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { Transaction } from '@prisma/client'

export interface AddBalanceDTO {
  actorId: string
  unitId: string
  affectedUserId?: string
  description: string
  amount: Money
  receiptUrl?: string | null
  reason: TransactionReason
}

export interface AddBalanceOutput {
  transactions: Transaction[]
}
