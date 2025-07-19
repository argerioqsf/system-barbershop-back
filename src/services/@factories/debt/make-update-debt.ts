import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { UpdateDebtService } from '@/services/debt/update-debt'

export function makeUpdateDebtService() {
  return new UpdateDebtService(new PrismaDebtRepository())
}
