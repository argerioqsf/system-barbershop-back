import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdatePlanService } from '@/services/plan/update-plan'
import { makeRecalculateUserSalesService } from '@/services/@factories/sale/make-recalculate-user-sales'

export function makeUpdatePlanService() {
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const profilesRepository = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSalesService()
  return new UpdatePlanService(
    planRepository,
    planProfileRepository,
    profilesRepository,
    recalcService,
  )
}
