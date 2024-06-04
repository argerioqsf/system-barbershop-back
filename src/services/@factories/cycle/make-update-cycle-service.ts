import { PrismaCycleRepository } from '@/repositories/prisma/prisma-cycle-repository'
import { UpdateEndCycleService } from '@/services/cycle/update-end-cycle-service'

export default function makeUpdateCycleService() {
  return new UpdateEndCycleService(new PrismaCycleRepository())
}
