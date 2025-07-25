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

  create(data: Prisma.PlanCreateInput) {
    return prisma.plan.create({ data })
  }

  update(id: string, data: Prisma.PlanUpdateInput) {
    return prisma.plan.update({ where: { id }, data })
  }

  findMany(where: Prisma.PlanWhereInput = {}) {
    return prisma.plan.findMany({ where })
  }

  async delete(id: string): Promise<void> {
    await prisma.plan.delete({ where: { id } })
  }
}
