import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'

export function makeIncrementBalanceUnitService() {
  return new IncrementBalanceUnitService(new PrismaUnitRepository())
}
