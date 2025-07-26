import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PayDebtService } from '@/services/plan/pay-debt'

export function makePayDebtService() {
  return new PayDebtService(
    new PrismaDebtRepository(),
    new PrismaPlanProfileRepository(),
    new PrismaSaleItemRepository(),
    new PrismaUnitRepository(),
  )
}
