import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { PlanProfile, PlanProfileStatus } from '@prisma/client'

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

    if (
      planProfile.status === PlanProfileStatus.CANCELED_ACTIVE ||
      planProfile.status === PlanProfileStatus.CANCELED_EXPIRED
    ) {
      return { planProfile }
    }

    let status: PlanProfileStatus = PlanProfileStatus.CANCELED_ACTIVE

    if (planProfile.status === PlanProfileStatus.EXPIRED) {
      status = PlanProfileStatus.CANCELED_EXPIRED
    }

    const updated = await this.repo.update(id, {
      status,
    })

    if (status === PlanProfileStatus.CANCELED_EXPIRED) {
      const profile = await this.profilesRepo.findById(planProfile.profileId)
      const userId = profile?.user.id
      if (userId) {
        await this.recalcService.execute({ userIds: [userId] })
      }
    }

    return { planProfile: updated }
  }
}
