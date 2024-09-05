import { CycleRepository } from '@/repositories/cycle-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Cycle } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { OrganizationNotFoundError } from '../@errors/organization-not-found-error'
import { CycleAlreadyStarted } from '../@errors/cycle-already-started-error'

interface CreateCycleServiceRequest {
  userId: string
  organizationId: string
}
interface CreateCycleServiceResponse {
  cycle: Cycle
}

export class CreateCycleService {
  constructor(
    private cycleRepository: CycleRepository,
    private userRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    organizationId,
  }: CreateCycleServiceRequest): Promise<CreateCycleServiceResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) throw new UserNotFoundError()

    const organization = user.organizations.find(
      (org) => org.organization.id === organizationId,
    )

    if (!organization) throw new OrganizationNotFoundError()

    const existCycle = organization.organization.cycles.find(
      (cycle) => cycle.end_cycle === undefined,
    )

    if (existCycle) {
      throw new CycleAlreadyStarted()
    }

    const cycle = await this.cycleRepository.create(
      organization.organization.id,
    )

    return { cycle }
  }
}
