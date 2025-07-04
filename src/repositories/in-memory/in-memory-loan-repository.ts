import { Loan, Prisma, LoanStatus } from '@prisma/client'
import { LoanRepository, LoanWithTransactions } from '../loan-repository'
import { randomUUID } from 'crypto'

export class InMemoryLoanRepository implements LoanRepository {
  public loans: LoanWithTransactions[] = []

  async create(data: Prisma.LoanUncheckedCreateInput): Promise<Loan> {
    const loan: Loan = {
      id: randomUUID(),
      userId: data.userId ?? '',
      unitId: data.unitId ?? '',
      sessionId: data.sessionId ?? '',
      status: (data.status as LoanStatus) ?? LoanStatus.PENDING,
      amount: data.amount ?? 0,
      createdAt: new Date(),
      paidAt: null,
      fullyPaid: false,
      updatedById: data.updatedById ?? null,
    }
    this.loans.push({ ...loan, transactions: [] })
    return loan
  }

  async update(
    id: string,
    data: Prisma.LoanUncheckedUpdateInput,
  ): Promise<Loan> {
    const idx = this.loans.findIndex((l) => l.id === id)
    if (idx >= 0) {
      const current = this.loans[idx]
      const updated: LoanWithTransactions = {
        ...current,
        userId: (data.userId ?? current.userId) as string,
        unitId: (data.unitId ?? current.unitId) as string,
        sessionId: (data.sessionId ?? current.sessionId) as string,
        status: (data.status ?? current.status) as LoanStatus,
        amount: (data.amount ?? current.amount) as number,
        fullyPaid: (data.fullyPaid ?? current.fullyPaid) as boolean,
        updatedById: (data.updatedById ?? current.updatedById) as string | null,
        paidAt: (data.paidAt ?? current.paidAt) as Date | null,
      }
      this.loans[idx] = updated
      return updated
    }
    throw new Error('Loan not found')
  }

  async findById(id: string): Promise<LoanWithTransactions | null> {
    return this.loans.find((l) => l.id === id) ?? null
  }

  async findMany(
    where: Prisma.LoanWhereInput = {},
  ): Promise<LoanWithTransactions[]> {
    // simple filter by userId, unitId, status, fullyPaid and createdAt range
    return this.loans.filter((l) => {
      const uid = where.userId && (where.userId as Prisma.StringFilter).equals
      if (uid && l.userId !== uid) return false
      const unitId =
        where.unitId && (where.unitId as Prisma.StringFilter).equals
      if (unitId && l.unitId !== unitId) return false
      const status =
        where.status && (where.status as Prisma.EnumLoanStatusFilter).equals
      if (status && l.status !== status) return false
      const fullyPaid =
        where.fullyPaid && (where.fullyPaid as Prisma.BoolFilter).equals
      if (typeof fullyPaid === 'boolean' && l.fullyPaid !== fullyPaid)
        return false
      const createdAt = where.createdAt as Prisma.DateTimeFilter | undefined
      if (createdAt?.gte && l.createdAt < createdAt.gte) return false
      if (createdAt?.lt && l.createdAt >= createdAt.lt) return false
      return true
    })
  }
}
