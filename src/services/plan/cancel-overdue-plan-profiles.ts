import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'

export class CancelOverduePlanProfilesService {
  constructor(
    private repo: PlanProfileRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

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
        const prof = await this.profilesRepo.findById(profile.profileId)
        const userId = prof?.user.id
        if (userId) {
          await this.recalcService.execute({ userIds: [userId] })
        }
      }
    }
  }
}
