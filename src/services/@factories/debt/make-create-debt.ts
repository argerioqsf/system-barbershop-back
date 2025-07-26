import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { CreateDebtService } from '@/services/debt/create-debt'

export function makeCreateDebtService() {
  return new CreateDebtService(new PrismaDebtRepository())
}
