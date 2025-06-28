import { prisma } from '@/lib/prisma'
import { Prisma, LoanRequest } from '@prisma/client'
import { LoanRequestRepository } from '../loan-request-repository'

export class PrismaLoanRequestRepository implements LoanRequestRepository {
  create(data: Prisma.LoanRequestUncheckedCreateInput): Promise<LoanRequest> {
    return prisma.loanRequest.create({ data })
  }

  findMany(where: Prisma.LoanRequestWhereInput = {}): Promise<LoanRequest[]> {
    return prisma.loanRequest.findMany({ where })
  }

  findById(id: string): Promise<LoanRequest | null> {
    return prisma.loanRequest.findUnique({ where: { id } })
  }

  update(
    id: string,
    data: Prisma.LoanRequestUpdateInput,
  ): Promise<LoanRequest> {
    return prisma.loanRequest.update({ where: { id }, data })
  }
}
