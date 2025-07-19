import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { GetDebtService } from '@/services/debt/get-debt'

export function makeGetDebtService() {
  return new GetDebtService(new PrismaDebtRepository())
}
