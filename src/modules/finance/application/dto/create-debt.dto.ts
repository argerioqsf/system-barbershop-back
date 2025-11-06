import { Money } from '@/core/domain/value-objects/money'
import { DebtStatus } from '@/modules/finance/domain/types/status'

export interface CreateDebtDTO {
  planId: string
  planProfileId: string
  amount: Money
  dueDate: Date
  status?: DebtStatus
  paymentDate?: Date | null
  createdAt?: Date
}
