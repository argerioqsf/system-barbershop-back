import { Money } from '@/core/domain/value-objects/money'
import { Transaction } from '@prisma/client'

export interface PayLoanDTO {
  loanId: string
  amount: Money
  actorId: string
}

export interface PayLoanOutput {
  transactions: Transaction[]
  remaining: Money
}
