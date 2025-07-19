import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { DeleteBenefitService } from '@/services/benefit/delete-benefit'

export function makeDeleteBenefitService() {
  return new DeleteBenefitService(new PrismaBenefitRepository())
}
