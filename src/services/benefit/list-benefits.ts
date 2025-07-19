import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit } from '@prisma/client'

interface ListBenefitsResponse {
  benefits: Benefit[]
}

export class ListBenefitsService {
  constructor(private repository: BenefitRepository) {}

  async execute(): Promise<ListBenefitsResponse> {
    const benefits = await this.repository.findMany()
    return { benefits }
  }
}
