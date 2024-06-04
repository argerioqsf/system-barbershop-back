import { CycleRepository } from '@/repositories/cycle-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Cycle } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { OrganizationNotFoundError } from '../@errors/organization-not-found-error'

interface CreateCycleServiceRequest {
  userId: string
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
  }: CreateCycleServiceRequest): Promise<CreateCycleServiceResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) throw new UserNotFoundError()

    const organization = user.organizations.map((org) => org.organization)[0]

    if (!organization) throw new OrganizationNotFoundError()

    const cycle = await this.cycleRepository.create(organization.id)

    return { cycle }
  }
}
