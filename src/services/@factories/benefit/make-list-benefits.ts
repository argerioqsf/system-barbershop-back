import { PrismaBenefitRepository } from '@/repositories/prisma/prisma-benefit-repository'
import { ListBenefitsService } from '@/services/benefit/list-benefits'

export function makeListBenefitsService() {
  return new ListBenefitsService(new PrismaBenefitRepository())
}
