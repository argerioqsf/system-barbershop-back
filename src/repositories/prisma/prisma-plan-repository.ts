import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { PlanRepository, PlanWithBenefits } from '../plan-repository'

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

  create(data: Prisma.PlanCreateInput) {
    return prisma.plan.create({ data })
  }

  update(id: string, data: Prisma.PlanUpdateInput) {
    return prisma.plan.update({ where: { id }, data })
  }

  findMany(where: Prisma.PlanWhereInput = {}) {
    return prisma.plan.findMany({ where })
  }
}
