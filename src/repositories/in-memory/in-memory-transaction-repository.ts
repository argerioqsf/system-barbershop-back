import { Prisma, Transaction, TransactionType } from '@prisma/client'
import { TransactionRepository } from '../transaction-repository'
import { randomUUID } from 'crypto'
import { TransactionFull } from '../prisma/prisma-transaction-repository'

export class InMemoryTransactionRepository implements TransactionRepository {
  public transactions: TransactionFull[] = []

  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    const tr: Transaction = {
      id: randomUUID(),
      userId: (data.user as any).connect.id,
      affectedUserId: (data.affectedUser as any)?.connect.id,
      unitId: (data.unit as any).connect.id,
      cashRegisterSessionId: (data.session as any).connect.id,
      type: data.type as TransactionType,
      description: data.description as string,
      amount: data.amount as number,
      isLoan: (data.isLoan as boolean | undefined) ?? false,
      receiptUrl: (data.receiptUrl as string | null | undefined) ?? null,
      createdAt: new Date(),
      saleId: null,
    } as any
    this.transactions.push(tr as unknown as TransactionFull)
    return tr
  }

  async findManyByUser(userId: string): Promise<TransactionFull[]> {
    return this.transactions.filter((t: any) => t.userId === userId)
  }

  async findMany(
    where: Prisma.TransactionWhereInput = {},
  ): Promise<TransactionFull[]> {
    return this.transactions.filter((t: any) => {
      if (where.unitId && t.unitId !== where.unitId) return false
      if (where.isLoan !== undefined && t.isLoan !== where.isLoan) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return t.unit?.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  findManyByUnit(unitId: string): Promise<Transaction[]> {
    throw new Error('not implemented')
  }

  findManyBySession(sessionId: string): Promise<Transaction[]> {
    throw new Error('not implemented')
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter((t) => t.id !== id)
  }
}
