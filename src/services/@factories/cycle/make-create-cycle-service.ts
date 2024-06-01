import { PrismaCycleRepository } from '@/repositories/prisma/prisma-cycle-repository'
import { CreateCycleService } from '@/services/cycle/create-cycle-service'

export default function makeCreateCycleService() {
  return new CreateCycleService(new PrismaCycleRepository())
}
