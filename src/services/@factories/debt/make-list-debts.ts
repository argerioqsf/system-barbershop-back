import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { ListDebtsService } from '@/services/debt/list-debts'

export function makeListDebtsService() {
  return new ListDebtsService(new PrismaDebtRepository())
}
