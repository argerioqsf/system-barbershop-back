import { UserToken } from '@/http/controllers/authenticate-controller'
import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit } from '@prisma/client'

interface ListBenefitsResponse {
  benefits: Benefit[]
}

export class ListBenefitsService {
  constructor(private repository: BenefitRepository) {}

  async execute(user: UserToken): Promise<ListBenefitsResponse> {
    const benefits = await this.repository.findMany({ unitId: user.unitId })
    return { benefits }
  }
}
