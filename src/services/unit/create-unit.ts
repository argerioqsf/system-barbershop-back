import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'
import { UserNotFromOrganizationError } from '@/services/@errors/user/user-not-from-organization-error'

interface CreateUnitRequest {
  name: string
  slug: string
  organizationId?: string
  allowsLoan?: boolean
  loanMonthlyLimit?: number
  appointmentFutureLimitDays?: number
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
      throw new UserNotFromOrganizationError()
    const unit = await this.repository.create({
      name: data.name,
      slug: data.slug,
      allowsLoan: data.allowsLoan ?? false,
      loanMonthlyLimit: data.loanMonthlyLimit ?? 0,
      appointmentFutureLimitDays: data.appointmentFutureLimitDays ?? 7,
      organization: { connect: { id: organizationId } },
    })
    return { unit }
  }
}
