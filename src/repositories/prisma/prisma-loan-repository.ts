import { prisma } from '@/lib/prisma'
import { Prisma, Loan } from '@prisma/client'
import { LoanRepository, LoanWithTransactions } from '../loan-repository'

export class PrismaLoanRepository implements LoanRepository {
  create(data: Prisma.LoanUncheckedCreateInput): Promise<Loan> {
    return prisma.loan.create({ data })
  }

  update(
    id: string,
    data: Prisma.LoanUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const prismaClient = tx || prisma
    return prismaClient.loan.update({ where: { id }, data })
  }

  findById(id: string): Promise<LoanWithTransactions | null> {
    return prisma.loan.findUnique({
      where: { id },
      include: { transactions: true },
    })
  }

  findMany(
    where: Prisma.LoanWhereInput = {},
    tx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactions[]> {
    const prismaClient = tx || prisma
    return prismaClient.loan.findMany({
      where,
      include: { transactions: true },
    })
  }
}
