import { Money } from '@/core/domain/value-objects/money'
import { DebtStatus } from '@/modules/finance/domain/types/status'

export interface UpdateDebtDTO {
  id: string
  value?: Money
  status?: DebtStatus
  paymentDate?: Date | null
}
