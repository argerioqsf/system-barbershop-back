import { prisma } from '@/lib/prisma'
import { Prisma, Debt } from '@prisma/client'
import { DebtRepository } from '../debt-repository'

export class PrismaDebtRepository implements DebtRepository {
  create(data: Prisma.DebtUncheckedCreateInput): Promise<Debt> {
    return prisma.debt.create({ data })
  }

  update(
    id: string,
    data: Prisma.DebtUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Debt> {
    const prismaClient = tx || prisma
    return prismaClient.debt.update({ where: { id }, data })
  }

  findById(id: string): Promise<Debt | null> {
    return prisma.debt.findUnique({ where: { id } })
  }

  findMany(where: Prisma.DebtWhereInput = {}): Promise<Debt[]> {
    return prisma.debt.findMany({ where })
  }

  async findManyPaginated(
    where: Prisma.DebtWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Debt[]; count: number }> {
    const [count, items] = await prisma.$transaction([
      prisma.debt.count({ where }),
      prisma.debt.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])
    return { items, count }
  }

  async delete(id: string): Promise<void> {
    await prisma.debt.delete({ where: { id } })
  }
}
