import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { GetBenefitService } from '@/services/benefit/get-benefit'

export function makeGetBenefitService() {
  return new GetBenefitService(new PrismaBenefitRepository())
}
