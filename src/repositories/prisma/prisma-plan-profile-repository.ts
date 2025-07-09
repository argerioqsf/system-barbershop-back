import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '../plan-profile-repository'

export class PrismaPlanProfileRepository implements PlanProfileRepository {
  async create(
    data: Prisma.PlanProfileUncheckedCreateInput & {
      debts?: Prisma.DebtUncheckedCreateWithoutPlanProfileInput[]
    },
  ): Promise<PlanProfileWithDebts> {
    return prisma.planProfile.create({
      data: {
        planStartDate: data.planStartDate,
        status: data.status,
        saleItem: { connect: { id: data.saleItemId } },
        dueDateDebt: data.dueDateDebt,
        plan: { connect: { id: data.planId } },
        profile: { connect: { id: data.profileId } },
        debts: data.debts ? { create: data.debts } : undefined,
      },
      include: { debts: true },
    })
  }

  async findMany(
    where: Prisma.PlanProfileWhereInput = {},
  ): Promise<PlanProfileWithDebts[]> {
    return prisma.planProfile.findMany({ where, include: { debts: true } })
  }

  async findById(id: string): Promise<PlanProfileWithDebts | null> {
    return prisma.planProfile.findUnique({
      where: { id },
      include: { debts: true },
    })
  }
}
