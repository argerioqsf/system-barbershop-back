import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface CreateUnitRequest {
  name: string
  slug: string
  organizationId?: string
  allowsLoan?: boolean
  userToken: UserToken
}

interface CreateUnitResponse {
  unit: Unit
}

export class CreateUnitService {
  constructor(private repository: UnitRepository) {}

  async execute(data: CreateUnitRequest): Promise<CreateUnitResponse> {
    let organizationId = data.userToken.organizationId
    if (data.userToken.role === 'ADMIN') {
      organizationId = data.organizationId ?? organizationId
    } else if (
      data.organizationId &&
      data.organizationId !== data.userToken.organizationId
    )
      throw new Error('You do not belong to this organization')
    const unit = await this.repository.create({
      name: data.name,
      slug: data.slug,
      allowsLoan: data.allowsLoan ?? false,
      organization: { connect: { id: organizationId } },
    })
    return { unit }
  }
}
