import { Debt } from '@prisma/client'
import { isPlanExpired } from './expired'
import { hasPendingDebts } from './helpers'

export function isPlanOverdue(
  debts: Debt[],
  today: Date = new Date(),
  lastDebtPaid: Debt,
) {
  const hasDebtsPending = hasPendingDebts(debts)
  const TheLastDebitIsExpired = isPlanExpired(lastDebtPaid, today)
  return hasDebtsPending ? TheLastDebitIsExpired : false
}
