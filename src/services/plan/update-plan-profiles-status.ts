import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { Debt, PlanProfileStatus } from '@prisma/client'
import { isPlanExpired } from './utils/expired'
import { getLastDebtPaid, hasPendingDebts } from './utils/helpers'
import { checkAndRecalculateAffectedSales } from '../sale/utils/item'
import { prisma } from '@/lib/prisma'

export class UpdatePlanProfilesStatusService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  private async handleExpired(
    lastDebtPaid: Debt,
    today: Date,
    planProfileStatus: PlanProfileStatus,
  ) {
    let newPlanProfileStatus: PlanProfileStatus | undefined

    const isExpired = isPlanExpired(lastDebtPaid, today)

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

  private handleDefaulted(debts: Debt[], planProfileStatus: PlanProfileStatus) {
    let newPlanProfileStatus: PlanProfileStatus | undefined
    const hasDebtsPending = hasPendingDebts(debts)
    if (hasDebtsPending) {
      if (planProfileStatus === PlanProfileStatus.EXPIRED) {
        newPlanProfileStatus = PlanProfileStatus.DEFAULTED
      }
    }
    return newPlanProfileStatus
  }

  private async checksAndGetsNewPlanProfileStatus(
    planProfile: PlanProfileWithDebts,
    today: Date,
  ) {
    let newPlanProfileStatus: PlanProfileStatus | undefined
    const debts = planProfile.debts
    const status = planProfile.status

    const lastDebtPaid = getLastDebtPaid(planProfile.debts)
    if (!lastDebtPaid) return undefined

    newPlanProfileStatus = await this.handleExpired(lastDebtPaid, today, status)

    if (!newPlanProfileStatus) {
      newPlanProfileStatus = this.handleDefaulted(debts, status)
    }

    return newPlanProfileStatus
  }

  async execute(date: Date = new Date()): Promise<void> {
    const planProfiles = await this.planProfileRepo.findMany()
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    await prisma.$transaction(async (tx) => {
      for (const planProfile of planProfiles) {
        const newPlanProfileStatus: PlanProfileStatus | undefined =
          await this.checksAndGetsNewPlanProfileStatus(planProfile, today)

        if (newPlanProfileStatus) {
          await this.planProfileRepo.update(
            planProfile.id,
            {
              status: newPlanProfileStatus,
            },
            tx,
          )
          await checkAndRecalculateAffectedSales(
            planProfile.profileId,
            this.recalcService,
            this.profilesRepo,
            tx,
          )
        }
      }
    })
  }
}
