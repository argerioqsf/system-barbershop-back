import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit, DiscountType } from '@prisma/client'

interface CreateBenefitRequest {
  name: string
  description?: string | null
  discount: number
  discountType: DiscountType
  unitId: string
}

interface CreateBenefitResponse {
  benefit: Benefit
}

export class CreateBenefitService {
  constructor(private repository: BenefitRepository) {}

  async execute(data: CreateBenefitRequest): Promise<CreateBenefitResponse> {
    const benefit = await this.repository.create({
      name: data.name,
      description: data.description ?? null,
      discount: data.discount,
      discountType: data.discountType,
      unit: { connect: { id: data.unitId } },
    })
    return { benefit }
  }
}
