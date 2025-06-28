import { PrismaLoanRequestRepository } from '@/repositories/prisma/prisma-loan-request-repository'
import { ListLoansService } from '@/services/loan/list-loans'

export function makeListLoans() {
  return new ListLoansService(new PrismaLoanRequestRepository())
}
