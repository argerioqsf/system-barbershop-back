import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { UpdateLoanStatusService } from '@/services/loan/update-loan-status'

export function makeUpdateLoanStatus() {
  return new UpdateLoanStatusService(
    new PrismaLoanRepository(),
    new PrismaProfilesRepository(),
    new PrismaUnitRepository(),
    new PrismaTransactionRepository(),
  )
}
