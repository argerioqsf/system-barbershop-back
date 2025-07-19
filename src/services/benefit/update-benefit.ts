import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit, Prisma } from '@prisma/client'

interface UpdateBenefitRequest {
  id: string
  data: Prisma.BenefitUpdateInput
}

interface UpdateBenefitResponse {
  benefit: Benefit
}

export class UpdateBenefitService {
  constructor(private repository: BenefitRepository) {}

  async execute({
    id,
    data,
  }: UpdateBenefitRequest): Promise<UpdateBenefitResponse> {
    const benefit = await this.repository.update(id, data)
    return { benefit }
  }
}
