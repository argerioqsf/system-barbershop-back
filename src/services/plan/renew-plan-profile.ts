import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { DebtRepository } from '@/repositories/debt-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { PaymentStatus, PlanProfileStatus, PlanProfile } from '@prisma/client'
import { prisma } from '@/lib/prisma'

interface RenewPlanProfileRequest {
  id: string
}

interface RenewPlanProfileResponse {
  planProfile: PlanProfile
}

export class RenewPlanProfileService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private planRepo: PlanRepository,
    private debtRepo: DebtRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute({
    id,
  }: RenewPlanProfileRequest): Promise<RenewPlanProfileResponse> {
    const planProfile = await this.planProfileRepo.findById(id)
    if (!planProfile) throw new Error('Plan profile not found')

    if (planProfile.status !== PlanProfileStatus.EXPIRED) {
      throw new Error('Plan profile is not expired')
    }

    const plan = await this.planRepo.findById(planProfile.planId)
    if (!plan) throw new Error('Plan not found')

    const profile = await this.profilesRepo.findById(planProfile.profileId)
    const userId = profile?.user.id

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await this.debtRepo.create(
        {
          value: plan.price,
          status: PaymentStatus.PAID,
          planId: plan.id,
          planProfileId: planProfile.id,
          paymentDate: now,
        },
        tx,
      )

      await this.planProfileRepo.update(
        planProfile.id,
        {
          status: PlanProfileStatus.PAID,
        },
        tx,
      )

      if (userId) {
        await this.recalcService.execute({ userIds: [userId] }, tx)
      }
    })

    const updated = await this.planProfileRepo.findById(planProfile.id)
    if (!updated) throw new Error('Plan profile not found')

    return { planProfile: updated }
  }
}
