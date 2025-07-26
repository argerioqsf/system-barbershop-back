import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { DebtRepository } from '@/repositories/debt-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'
import { differenceInCalendarDays } from 'date-fns'

export class GeneratePlanDebtsService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private planRepo: PlanRepository,
    private debtRepo: DebtRepository,
  ) {}

  async execute(date: Date = new Date()): Promise<void> {
    const profiles = await this.planProfileRepo.findMany({
      status: PlanProfileStatus.PAID,
    })

    for (const profile of profiles) {
      if (profile.debts.length === 0) continue
      const sorted = [...profile.debts].sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
      )
      const lastDebt = sorted[0]
      if (lastDebt.status !== PaymentStatus.PAID) continue

      const plan = await this.planRepo.findByIdWithRecurrence(profile.planId)
      if (!plan) continue
      const nextDate = new Date(lastDebt.paymentDate)
      nextDate.setUTCMonth(nextDate.getUTCMonth() + plan.typeRecurrence.period)
      nextDate.setUTCDate(profile.dueDateDebt)
      nextDate.setUTCHours(0, 0, 0, 0)

      const utc = (d: Date) =>
        new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const diff = differenceInCalendarDays(utc(nextDate), utc(date))
      const exists = profile.debts.some(
        (d) => d.paymentDate.getTime() === nextDate.getTime(),
      )
      if (diff <= 20 && diff >= 0 && !exists) {
        await this.debtRepo.create({
          value: lastDebt.value,
          status: PaymentStatus.PENDING,
          planId: profile.planId,
          planProfileId: profile.id,
          paymentDate: nextDate,
        })
      }
    }
  }
}
