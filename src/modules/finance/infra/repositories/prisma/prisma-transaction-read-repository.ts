import { Prisma } from '@prisma/client'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import {
  TransactionReadFilter,
  TransactionReadRepository,
} from '@/modules/finance/application/ports/transaction-read-repository'
import type { ResponseTransactionsFindMany } from '@/repositories/transaction-repository'

export class PrismaTransactionReadRepository
  implements TransactionReadRepository
{
  constructor(
    private readonly repository = new PrismaTransactionRepository(),
  ) {}

  async findMany(
    filter: TransactionReadFilter,
    pagination?: { page: number; perPage: number },
  ): Promise<ResponseTransactionsFindMany> {
    const where: Prisma.TransactionWhereInput = {}

    if (filter.unitId) {
      where.unitId = filter.unitId
    }

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.affectedUserId) {
      where.affectedUserId = filter.affectedUserId
    }

    return this.repository.findMany(where, pagination)
  }

  async findManyByUnit(unitId: string) {
    return this.repository.findManyByUnit(unitId)
  }

  async findManyByAffectedUser(affectedUserId: string) {
    const { items } = await this.repository.findMany({
      affectedUserId,
    })

    return items
  }
}
