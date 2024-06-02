import { CycleRepository } from '@/repositories/cycle-repository'
import { Cycle } from '@prisma/client'

interface CreateCycleServiceResponse {
  cycle: Cycle
}

export class CreateCycleService {
  constructor(private cycleRepository: CycleRepository) {}

  async execute(): Promise<CreateCycleServiceResponse> {
    const cycle = await this.cycleRepository.create({ start_cycle: '' })

    return { cycle }
  }
}
