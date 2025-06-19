import { UsersRepository } from '@/repositories/users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit/unit-not-found-error'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { UserToken } from '@/http/controllers/authenticate-controller'

export class UnitNotFromOrganizationError extends Error {
  constructor() {
    super('Unit does not belong to your organization')
  }
}

interface SetUserUnitRequest {
  user: UserToken
  unitId: string
}

export class SetUserUnitService {
  constructor(
    private usersRepository: UsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({ user, unitId }: SetUserUnitRequest): Promise<void> {
    if (!user) throw new UserNotFoundError()

    const unit = await this.unitRepository.findById(unitId)
    if (!unit) throw new UnitNotFoundError()

    if (unit.organizationId !== user.organizationId) {
      throw new UnitNotFromOrganizationError()
    }

    await this.usersRepository.update(user.sub, {
      unit: { connect: { id: unitId } },
    })
  }
}
