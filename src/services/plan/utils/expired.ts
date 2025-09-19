import { Debt } from '@prisma/client'
import { addMonthsCustom } from './helpers'

function getDateWithoutTime(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}
export function isPlanExpired(
  lastDebtPaid: Debt,
  today: Date = new Date(),
): boolean {
  return getDateWithoutTime(today) > getDateWithoutTime(lastDebtPaid.dueDate)
}

export function isPlanExpiredOfTheLimit(
  lastDebtPaid: Debt,
  planTime: number,
  today: Date = new Date(),
): boolean {
  // TODO: deixar com que cada unidade possa cofigurar seu maximumTimeOfDefaultedPlanInMonths
  const maximumTimeOfDefaultedPlanInMonths = 1
  const maximumDefaultPeriod = planTime + maximumTimeOfDefaultedPlanInMonths
  const limitDefaultPeriodPlan = addMonthsCustom(
    new Date(lastDebtPaid.dueDate),
    maximumDefaultPeriod,
  )
  return getDateWithoutTime(today) > getDateWithoutTime(limitDefaultPeriodPlan)
}
