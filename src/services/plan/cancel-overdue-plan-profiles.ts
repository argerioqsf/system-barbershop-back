import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileStatus } from '@prisma/client'
import { isPlanExpiredOfTheLimit } from './utils/expired'
import { getLastDebtPaid } from './utils/helpers'

export class CancelOverduePlanProfilesService {
  constructor(
    private repo: PlanProfileRepository,
    private planRepo: PlanRepository,
  ) {}

  async execute(date: Date = new Date()): Promise<void> {
    const today = new Date(date)
    today.setUTCHours(0, 0, 0, 0)

    const planProfilesExpired = await this.repo.findMany({
      status: PlanProfileStatus.EXPIRED,
    })

    for (const planProfile of planProfilesExpired) {
      if (planProfile.debts.length === 0) continue
      // TODO: a unidade tera um campo que dira se ira cancelar o plano depois que o
      // maximumTimeOfDefaultedPlanInMonths tiver passado ou se não, se esse campo
      // for true executar essa logica, se for false não executar

      const lastDebtPaid = getLastDebtPaid(planProfile.debts)
      if (!lastDebtPaid) continue

      const plan = await this.planRepo.findByIdWithRecurrence(
        planProfile.planId,
      )
      if (!plan) continue

      const planTime = plan.typeRecurrence.period
      const planIsExpiredOfTheLimit = isPlanExpiredOfTheLimit(
        lastDebtPaid,
        planTime,
        today,
      )
      if (planIsExpiredOfTheLimit) {
        await this.repo.update(planProfile.id, {
          status: PlanProfileStatus.CANCELED_EXPIRED,
        })
      }
    }
  }
}
