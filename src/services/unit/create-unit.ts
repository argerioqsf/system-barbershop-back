import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface CreateUnitRequest {
  name: string
  slug: string
  organizationId: string
}

interface CreateUnitResponse {
  unit: Unit
}

export class CreateUnitService {
  constructor(private repository: UnitRepository) {}

  async execute(data: CreateUnitRequest): Promise<CreateUnitResponse> {
    const unit = await this.repository.create({
      name: data.name,
      slug: data.slug,
      organization: { connect: { id: data.organizationId } },
    })
    return { unit }
  }
}
