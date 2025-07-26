import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdateBenefitService } from '@/services/benefit/update-benefit'
import { makeRecalculateUserSalesService } from '@/services/@factories/sale/make-recalculate-user-sales'

export function makeUpdateBenefitService() {
  const benefitRepository = new PrismaBenefitRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const profilesRepository = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSalesService()

  return new UpdateBenefitService(
    benefitRepository,
    planRepository,
    planProfileRepository,
    profilesRepository,
    recalcService,
  )
}
