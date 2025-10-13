import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { CreateBenefitService } from '@/services/benefit/create-benefit'

export function makeCreateBenefitService() {
  return new CreateBenefitService(
    new PrismaBenefitRepository(),
    new PrismaPlanRepository(),
  )
}
