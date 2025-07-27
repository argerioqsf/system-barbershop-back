import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanProfile, PlanProfileStatus } from '@prisma/client'

interface CancelPlanProfileRequest {
  id: string
}

interface CancelPlanProfileResponse {
  planProfile: PlanProfile
}

export class CancelPlanProfileService {
  constructor(private repo: PlanProfileRepository) {}

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
    return { planProfile: updated }
  }
}
