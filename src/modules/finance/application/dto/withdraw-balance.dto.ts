import { Money } from '@/core/domain/value-objects/money'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { Transaction } from '@prisma/client'

export interface WithdrawBalanceDTO {
  actorId: string
  unitId: string
  affectedUserId?: string
  description?: string
  amount: Money
  receiptUrl?: string | null
  discountLoans?: boolean
  reason: TransactionReason
}

export interface WithdrawBalanceOutput {
  transactions: Transaction[]
}
