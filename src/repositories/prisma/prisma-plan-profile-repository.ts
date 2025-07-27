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
    tx?: Prisma.TransactionClient,
  ): Promise<PlanProfileWithDebts> {
    const prismaClient = tx || prisma
    return prismaClient.planProfile.create({
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
    tx?: Prisma.TransactionClient,
  ): Promise<PlanProfileWithDebts[]> {
    const prismaClient = tx || prisma
    return prismaClient.planProfile.findMany({
      where,
      include: { debts: true },
    })
  }

  async findById(id: string): Promise<PlanProfileWithDebts | null> {
    return prisma.planProfile.findUnique({
      where: { id },
      include: { debts: true },
    })
  }

  async findByDebtId(id: string): Promise<PlanProfileWithDebts | null> {
    return prisma.planProfile.findFirst({
      where: { debts: { some: { id } } },
      include: { debts: true },
    })
  }

  async update(
    id: string,
    data: Prisma.PlanProfileUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || prisma
    return prismaClient.planProfile.update({ where: { id }, data })
  }
}
