import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateLoanStatusService } from '@/services/loan/update-loan-status'

export function makeUpdateLoanStatus() {
  return new UpdateLoanStatusService(
    new PrismaLoanRepository(),
    new PrismaUnitRepository(),
  )
}
