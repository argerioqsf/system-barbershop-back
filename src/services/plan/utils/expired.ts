import { Debt } from '@prisma/client'

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

function getDateWithoutTime(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}
export function isPlanExpired(
  lastDebtPaid: Debt,
  planTime: number,
  today: Date = new Date(),
): boolean {
  const limitPlan = addMonths(lastDebtPaid.paymentDate, planTime)
  return lastDebtPaid
    ? getDateWithoutTime(today) > getDateWithoutTime(limitPlan)
    : false
}
