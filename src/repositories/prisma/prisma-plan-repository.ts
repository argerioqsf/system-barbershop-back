import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { PlanRepository } from '../plan-repository'

export class PrismaPlanRepository implements PlanRepository {
  findById(id: string) {
    return prisma.plan.findUnique({ where: { id } })
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
