import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { DeleteDebtService } from '@/services/debt/delete-debt'

export function makeDeleteDebtService() {
  return new DeleteDebtService(new PrismaDebtRepository())
}
