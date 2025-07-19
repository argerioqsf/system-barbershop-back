import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit } from '@prisma/client'

interface GetBenefitRequest {
  id: string
}

interface GetBenefitResponse {
  benefit: Benefit | null
}

export class GetBenefitService {
  constructor(private repository: BenefitRepository) {}

  async execute({ id }: GetBenefitRequest): Promise<GetBenefitResponse> {
    const benefit = await this.repository.findById(id)
    return { benefit }
  }
}
