import { Money } from '@/core/domain/value-objects/money'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { Transaction } from '@prisma/client'

export interface UpdateLoanStatusDTO {
  loanId: string
  status: LoanStatus
  updatedById: string
}

export interface UpdateLoanStatusOutput {
  loan: {
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
  transactions: Transaction[]
}
