import { CycleRepository } from '@/repositories/cycle-repository'
import { Cycle } from '@prisma/client'

interface UpdateEndCycleServiceRequest {
  id: string
}

interface UpdateEndCycleServiceResponse {
  cycle: Cycle
}

export class UpdateEndCycleService {
  constructor(private cycleRepository: CycleRepository) {}

  async execute({
    id,
  }: UpdateEndCycleServiceRequest): Promise<UpdateEndCycleServiceResponse> {
    const cycle = await this.cycleRepository.update(id, {
      end_cycle: new Date(),
    })

    return {
      cycle,
    }
  }
}
