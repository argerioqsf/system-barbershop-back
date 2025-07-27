import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { PaymentStatus, PlanProfileStatus } from '@prisma/client'

export class UpdatePlanProfilesStatusService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute(date: Date = new Date()): Promise<void> {
    const planProfiles = await this.planProfileRepo.findMany()
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    for (const planProfile of planProfiles) {
      const hasOverdueDebt = planProfile.debts.some(
        (d) =>
          d.status !== PaymentStatus.PAID &&
          d.paymentDate.getTime() < today.getTime(),
      )

      if (hasOverdueDebt && planProfile.status === PlanProfileStatus.PAID) {
        await this.planProfileRepo.update(planProfile.id, {
          status: PlanProfileStatus.DEFAULTED,
        })
        const profile = await this.profilesRepo.findById(planProfile.profileId)
        const userId = profile?.user.id
        if (userId) {
          await this.recalcService.execute({ userIds: [userId] })
        }
      }
    }
  }
}
