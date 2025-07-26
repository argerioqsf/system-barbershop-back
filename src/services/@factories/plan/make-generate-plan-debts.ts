import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { GeneratePlanDebtsService } from '@/services/plan/generate-plan-debts'

export function makeGeneratePlanDebts() {
  const planProfileRepo = new PrismaPlanProfileRepository()
  const planRepo = new PrismaPlanRepository()
  const debtRepo = new PrismaDebtRepository()
  return new GeneratePlanDebtsService(planProfileRepo, planRepo, debtRepo)
}
