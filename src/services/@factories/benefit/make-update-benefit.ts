import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { UpdateBenefitService } from '@/services/benefit/update-benefit'

export function makeUpdateBenefitService() {
  return new UpdateBenefitService(new PrismaBenefitRepository())
}
