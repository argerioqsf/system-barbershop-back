import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'

export class CancelOverduePlanProfilesService {
  constructor(private repo: PlanProfileRepository) {}

  async execute(date: Date = new Date()): Promise<void> {
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    const profiles = await this.repo.findMany({
      status: { not: PlanProfileStatus.CANCELED },
    })

    for (const profile of profiles) {
      if (profile.debts.length === 0) continue
      const sorted = [...profile.debts].sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
      )
      const lastDebt = sorted[0]
      if (lastDebt.status === PaymentStatus.PAID) continue
      const limit = new Date(lastDebt.paymentDate)
      limit.setUTCMonth(limit.getUTCMonth() + 1)
      limit.setUTCHours(0, 0, 0, 0)
      if (today.getTime() > limit.getTime()) {
        await this.repo.update(profile.id, {
          status: PlanProfileStatus.CANCELED,
        })
      }
    }
  }
}
