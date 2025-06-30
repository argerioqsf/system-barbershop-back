import { Loan, Prisma, Transaction } from '@prisma/client'
import { LoanRepository, LoanWithTransactions } from '../loan-repository'
import { randomUUID } from 'crypto'

export class InMemoryLoanRepository implements LoanRepository {
  public loans: LoanWithTransactions[] = []

  async create(data: Prisma.LoanUncheckedCreateInput): Promise<Loan> {
    const loan: Loan = {
      id: randomUUID(),
      userId: data.userId!,
      unitId: data.unitId!,
      sessionId: data.sessionId!,
      status: data.status as any,
      amount: data.amount!,
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
      const updated = { ...current, ...data } as LoanWithTransactions
      this.loans[idx] = updated
      return updated
    }
    throw new Error('Loan not found')
  }

  async findById(id: string): Promise<LoanWithTransactions | null> {
    return this.loans.find((l) => l.id === id) ?? null
  }

  async findMany(where: Prisma.LoanWhereInput = {}): Promise<LoanWithTransactions[]> {
    // simple filter only by userId, unitId, status
    return this.loans.filter((l) => {
      if (where.userId && (where.userId as any).equals && l.userId !== (where.userId as any).equals)
        return false
      if (where.unitId && (where.unitId as any).equals && l.unitId !== (where.unitId as any).equals)
        return false
      if (where.status && (where.status as any).equals && l.status !== (where.status as any).equals)
        return false
      if (where.fullyPaid && (where.fullyPaid as any).equals && l.fullyPaid !== (where.fullyPaid as any).equals)
        return false
      return true
    })
  }
}
