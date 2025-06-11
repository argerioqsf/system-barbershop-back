import { UsersRepository } from '@/repositories/users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'
import { UserNotFoundError } from '../@errors/user-not-found-error'

export class UnitNotFromOrganizationError extends Error {
  constructor() {
    super('Unit does not belong to your organization')
  }
}

interface SetUserUnitRequest {
  userId: string
  unitId: string
}

export class SetUserUnitService {
  constructor(
    private usersRepository: UsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({ userId, unitId }: SetUserUnitRequest): Promise<void> {
    const user = await this.usersRepository.findById(userId)
    if (!user) throw new UserNotFoundError()

    const unit = await this.unitRepository.findById(unitId)
    if (!unit) throw new UnitNotFoundError()

    if (unit.organizationId !== user.organizationId) {
      throw new UnitNotFromOrganizationError()
    }

    await this.usersRepository.update(userId, {
      unit: { connect: { id: unitId } },
    })
  }
}
