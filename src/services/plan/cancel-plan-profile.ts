import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { PaymentStatus, PlanProfile, PlanProfileStatus } from '@prisma/client'

interface CancelPlanProfileRequest {
  id: string
}

interface CancelPlanProfileResponse {
  planProfile: PlanProfile
}

export class CancelPlanProfileService {
  constructor(
    private repo: PlanProfileRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute({
    id,
  }: CancelPlanProfileRequest): Promise<CancelPlanProfileResponse> {
    const planProfile = await this.repo.findById(id)
    if (!planProfile) throw new Error('Plan profile not found')

    if (planProfile.status === PlanProfileStatus.CANCELED) {
      return { planProfile }
    }

    const updated = await this.repo.update(id, {
      status: PlanProfileStatus.CANCELED,
    })

    if (planProfile.debts.length > 0) {
      const sorted = [...planProfile.debts].sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
      )
      const lastDebt = sorted[0]
      if (lastDebt.status === PaymentStatus.PAID) {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        if (today.getTime() > lastDebt.paymentDate.getTime()) {
          const profile = await this.profilesRepo.findById(
            planProfile.profileId,
          )
          const userId = profile?.user.id
          if (userId) {
            await this.recalcService.execute({ userIds: [userId] })
          }
        }
      }
    }

    return { planProfile: updated }
  }
}
