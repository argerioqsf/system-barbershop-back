import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { DebtRepository } from '@/repositories/debt-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'
import { differenceInCalendarDays } from 'date-fns'
import { calculateNextDueDate, getLastDebtPaid } from './utils/helpers'

export class GeneratePlanDebtsService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private planRepo: PlanRepository,
    private debtRepo: DebtRepository,
  ) {}

  async execute(date: Date = new Date()): Promise<void> {
    const planProfiles = await this.planProfileRepo.findMany({
      status: PlanProfileStatus.PAID,
    })

    for (const planProfile of planProfiles) {
      if (planProfile.debts.length === 0) continue

      const lastDebtPaid = getLastDebtPaid(planProfile.debts)
      if (!lastDebtPaid) continue
      if (!lastDebtPaid.paymentDate) continue

      const plan = await this.planRepo.findByIdWithRecurrence(
        planProfile.planId,
      )
      if (!plan) continue

      const newDueDate = calculateNextDueDate(
        lastDebtPaid.paymentDate,
        plan.typeRecurrence,
        planProfile.dueDayDebt,
      )

      const utc = (d: Date) =>
        new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

      const diff = differenceInCalendarDays(utc(newDueDate), utc(date))
      const exists = planProfile.debts.some(
        (debit) =>
          debit.status === PaymentStatus.PENDING &&
          debit.dueDate.getTime() === newDueDate.getTime(),
      )
      // TODO: deixar com que cada unidade possa cofigurar sua daysBeforeDueDate
      const daysBeforeDueDate = 20
      if (diff <= daysBeforeDueDate && !exists) {
        await this.debtRepo.create({
          value: lastDebtPaid.value,
          status: PaymentStatus.PENDING,
          planId: planProfile.planId,
          planProfileId: planProfile.id,
          dueDate: newDueDate,
        })
      }
    }
  }
}
