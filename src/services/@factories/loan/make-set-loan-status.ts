import { PrismaLoanRequestRepository } from '@/repositories/prisma/prisma-loan-request-repository'
import { SetLoanStatusService } from '@/services/loan/set-loan-status'

export function makeSetLoanStatus() {
  return new SetLoanStatusService(new PrismaLoanRequestRepository())
}
