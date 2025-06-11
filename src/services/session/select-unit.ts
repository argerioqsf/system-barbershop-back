import { UnitRepository } from '@/repositories/unit-repository'
import { UsersRepository } from '@/repositories/users-repository'

interface SelectUnitRequest {
  userId: string
  unitId: string
}

export class SelectUnitService {
  constructor(
    private usersRepository: UsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({ userId, unitId }: SelectUnitRequest): Promise<void> {
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    const unit = await this.unitRepository.findById(unitId)
    if (!unit) {
      throw new Error('Unit not found')
    }
    if (unit.organizationId !== user.organizationId) {
      throw new Error('Unit not allowed for this user')
    }
  }
}
