import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { ListUserLoansService } from '@/services/loan/list-user-loans'

export function makeListUserLoans() {
  return new ListUserLoansService(new PrismaLoanRepository())
}
