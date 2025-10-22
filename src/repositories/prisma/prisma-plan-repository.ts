import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
  PlanWithRecurrence,
} from '../plan-repository'

export class PrismaPlanRepository implements PlanRepository {
  findById(id: string) {
    return prisma.plan.findUnique({ where: { id } })
  }

  findByIdWithBenefits(id: string): Promise<PlanWithBenefits | null> {
    return prisma.plan.findUnique({
      where: { id },
      include: {
        benefits: {
          include: {
            benefit: {
              include: { categories: true, services: true, products: true },
            },
          },
        },
      },
    }) as Promise<PlanWithBenefits | null>
  }

  findByIdWithBenefitsAndRecurrence(
    id: string,
  ): Promise<PlanWithBenefitsAndRecurrence | null> {
    return prisma.plan.findUnique({
      where: { id },
      include: {
        benefits: {
          include: {
            benefit: {
              include: { categories: true, services: true, products: true },
            },
          },
        },
        typeRecurrence: true,
      },
    })
  }

  findByIdWithRecurrence(id: string): Promise<PlanWithRecurrence | null> {
    return prisma.plan.findUnique({
      where: { id },
      include: { typeRecurrence: true },
    })
  }

  create(data: Prisma.PlanCreateInput, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || prisma
    return prismaClient.plan.create({ data })
  }

  update(
    id: string,
    data: Prisma.PlanUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || prisma
    return prismaClient.plan.update({ where: { id }, data })
  }

  findMany(
    where: Prisma.PlanWhereInput = {},
    tx?: Prisma.TransactionClient,
  ): Promise<PlanWithBenefits[]> {
    const prismaClient = tx || prisma
    return prismaClient.plan.findMany({
      where,
      include: {
        benefits: {
          include: {
            benefit: {
              include: { categories: true, services: true, products: true },
            },
          },
        },
      },
    })
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = tx || prisma
    await prismaClient.plan.delete({ where: { id } })
  }
}
