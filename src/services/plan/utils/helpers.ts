import { Debt, PaymentStatus, TypeRecurrence } from '@prisma/client'

export function hasPendingDebts(debts: Debt[]) {
  return debts.some((d) => d.status === PaymentStatus.PENDING)
}

export function getLastDebt(debts: Debt[]) {
  return debts.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0]
}

export function getLastDebtPaid(debts: Debt[]): Debt | undefined {
  const debtsPaid: Debt[] = debts.filter((d) => d.status === PaymentStatus.PAID)
  const lastDebtPaid = getLastDebt(debtsPaid)
  return lastDebtPaid
}

export function addMonthsCustom(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

export function calculateNextDueDate(
  lastPaymentDate: Date,
  recurrence: TypeRecurrence,
  dueDayDebt: number,
): Date {
  const nextDate = new Date(lastPaymentDate)
  nextDate.setUTCMonth(nextDate.getUTCMonth() + recurrence.period)
  nextDate.setUTCDate(dueDayDebt)
  nextDate.setUTCHours(0, 0, 0, 0)

  return nextDate
}
