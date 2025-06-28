import { PrismaLoanRequestRepository } from '@/repositories/prisma/prisma-loan-request-repository'
import { RequestLoanService } from '@/services/loan/request-loan'

export function makeRequestLoan() {
  return new RequestLoanService(new PrismaLoanRequestRepository())
}
