import { prisma } from '@/lib/prisma'
import { Prisma, Benefit } from '@prisma/client'
import { BenefitRepository } from '../benefit-repository'

export class PrismaBenefitRepository implements BenefitRepository {
  create(data: Prisma.BenefitCreateInput): Promise<Benefit> {
    return prisma.benefit.create({ data })
  }

  update(
    id: string,
    data: Prisma.BenefitUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Benefit> {
    const prismaClient = tx || prisma
    return prismaClient.benefit.update({ where: { id }, data })
  }

  findById(id: string): Promise<Benefit | null> {
    return prisma.benefit.findUnique({ where: { id } })
  }

  findMany(where: Prisma.BenefitWhereInput = {}): Promise<Benefit[]> {
    return prisma.benefit.findMany({ where })
  }

  async delete(id: string): Promise<void> {
    await prisma.benefit.delete({ where: { id } })
  }
}
