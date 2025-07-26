import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { CreateBenefitService } from '@/services/benefit/create-benefit'

export function makeCreateBenefitService() {
  return new CreateBenefitService(new PrismaBenefitRepository())
}
