import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { Debt, PaymentStatus, PlanProfileStatus } from '@prisma/client'
import {
  PlanRepository,
  PlanWithRecurrence,
} from '@/repositories/plan-repository'
import { isPlanExpired } from './utils/expired'

export class UpdatePlanProfilesStatusService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
    private planRepo: PlanRepository,
  ) {}

  private async checkAndRecalculateAffectedSales(profileId: string) {
    const profile = await this.profilesRepo.findById(profileId)
    const userId = profile?.user.id
    if (userId) {
      await this.recalcService.execute({ userIds: [userId] })
    }
  }

  private async handleExpired(
    debts: Debt[],
    today: Date,
    planProfileStatus: PlanProfileStatus,
    plan: PlanWithRecurrence,
  ) {
    let newPlanProfileStatus: PlanProfileStatus | undefined
    const lastDebtPaid = debts
      .filter((d) => d.status === PaymentStatus.PAID)
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]

    const planTime = plan.typeRecurrence.period
    const isExpired = isPlanExpired(lastDebtPaid, planTime, today)

    if (isExpired) {
      if (planProfileStatus === PlanProfileStatus.CANCELED_ACTIVE) {
        newPlanProfileStatus = PlanProfileStatus.CANCELED_EXPIRED
      }

      if (planProfileStatus === PlanProfileStatus.PAID) {
        newPlanProfileStatus = PlanProfileStatus.EXPIRED
      }
    }
    return newPlanProfileStatus
  }

  private handleOverdue(
    debts: Debt[],
    today: Date,
    planProfileStatus: PlanProfileStatus,
  ) {
    let newPlanProfileStatus: PlanProfileStatus | undefined
    const hasOverdueDebt = debts.some(
      (d) =>
        d.status !== PaymentStatus.PAID &&
        d.paymentDate.getTime() < today.getTime(),
    )
    if (hasOverdueDebt) {
      if (planProfileStatus === PlanProfileStatus.PAID) {
        newPlanProfileStatus = PlanProfileStatus.DEFAULTED
      }
    }
    return newPlanProfileStatus
  }

  private async handleChangePaymentStatus(
    planProfile: PlanProfileWithDebts,
    plan: PlanWithRecurrence,
    today: Date,
  ) {
    let newPlanProfileStatus: PlanProfileStatus | undefined
    newPlanProfileStatus = await this.handleExpired(
      planProfile.debts,
      today,
      planProfile.status,
      plan,
    )

    if (!newPlanProfileStatus) {
      newPlanProfileStatus = this.handleOverdue(
        planProfile.debts,
        today,
        planProfile.status,
      )
    }

    return newPlanProfileStatus
  }

  async execute(date: Date = new Date()): Promise<void> {
    const planProfiles = await this.planProfileRepo.findMany()
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    for (const planProfile of planProfiles) {
      const plan = await this.planRepo.findByIdWithRecurrence(
        planProfile.planId,
      )
      if (!plan) return undefined
      const newPlanProfileStatus: PlanProfileStatus | undefined =
        await this.handleChangePaymentStatus(planProfile, plan, today)

      if (newPlanProfileStatus) {
        await this.planProfileRepo.update(planProfile.id, {
          status: newPlanProfileStatus,
        })
      }

      this.checkAndRecalculateAffectedSales(planProfile.profileId)
    }
  }
}
