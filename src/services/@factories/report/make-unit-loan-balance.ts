import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { UnitLoanBalanceService } from '@/services/report/unit-loan-balance'

export function makeUnitLoanBalance() {
  const transactionRepo = new PrismaTransactionRepository()
  const service = new UnitLoanBalanceService(transactionRepo)
  return service
}
