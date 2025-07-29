import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'

export class CancelOverduePlanProfilesService {
  constructor(private repo: PlanProfileRepository) {}

  async execute(date: Date = new Date()): Promise<void> {
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    const profiles = await this.repo.findMany({
      status: {
        notIn: [
          PlanProfileStatus.CANCELED_ACTIVE,
          PlanProfileStatus.CANCELED_EXPIRED,
        ],
      },
    })

    for (const profile of profiles) {
      if (profile.debts.length === 0) continue
      const sorted = [...profile.debts].sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
      )
      const lastDebt = sorted[0]
      if (lastDebt.status === PaymentStatus.PAID) continue
      const limit = new Date(lastDebt.paymentDate)
      // TODO: deixar com que cada unidade possa cofigurar seu maximumTimeOfDefaultedPlanInMonths
      const maximumTimeOfDefaultedPlanInMonths = 1
      limit.setUTCMonth(
        limit.getUTCMonth() + maximumTimeOfDefaultedPlanInMonths,
      )
      limit.setUTCHours(0, 0, 0, 0)
      if (today.getTime() > limit.getTime()) {
        await this.repo.update(profile.id, {
          status: PlanProfileStatus.CANCELED_EXPIRED,
        })
      }
    }
  }
}
