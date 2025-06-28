import { Prisma, LoanRequest, LoanStatus } from '@prisma/client'
import { LoanRequestRepository } from '../loan-request-repository'
import { randomUUID } from 'crypto'

export class InMemoryLoanRequestRepository implements LoanRequestRepository {
  constructor(public items: LoanRequest[] = []) {}

  async create(
    data: Prisma.LoanRequestUncheckedCreateInput,
  ): Promise<LoanRequest> {
    const loan: LoanRequest = {
      id: randomUUID(),
      userId: data.userId,
      unitId: data.unitId,
      amount: data.amount,
      status: (data.status as LoanStatus) ?? 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.items.push(loan)
    return loan
  }

  async findMany(
    where: Prisma.LoanRequestWhereInput = {},
  ): Promise<LoanRequest[]> {
    return this.items.filter((lr) => {
      if (where.userId && lr.userId !== where.userId) return false
      if (where.unitId && lr.unitId !== where.unitId) return false
      if (where.status && lr.status !== (where.status as LoanStatus))
        return false
      return true
    })
  }

  async findById(id: string): Promise<LoanRequest | null> {
    return this.items.find((lr) => lr.id === id) ?? null
  }

  async update(
    id: string,
    data: Prisma.LoanRequestUpdateInput,
  ): Promise<LoanRequest> {
    const loan = this.items.find((lr) => lr.id === id)
    if (!loan) throw new Error('Loan request not found')
    Object.assign(loan, data)
    return loan
  }
}
