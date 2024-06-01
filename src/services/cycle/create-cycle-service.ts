import { CycleRepository } from '@/repositories/cycle-repository'
import { Cycle } from '@prisma/client'

interface CreateCycleServiceRequest {
  start_cycle?: Date
  end_cycle?: Date
}

interface CreateCycleServiceResponse {
  cycle: Cycle
}

export class CreateCycleService {
  constructor(private cycleRepository: CycleRepository) {}

  async execute({
    start_cycle,
    end_cycle,
  }: CreateCycleServiceRequest): Promise<CreateCycleServiceResponse> {
    const cycle = await this.cycleRepository.create({ start_cycle, end_cycle })

    return { cycle }
  }
}
