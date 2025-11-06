import { Money } from '@/core/domain/value-objects/money'

export interface UpdateCashFinalAmountDTO {
  sessionId: string
  amount: Money
}
