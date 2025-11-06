import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
  CashSessionFilters,
  CreateCashSessionInput,
} from '@/modules/finance/application/ports/cash-register-repository'
import { Money } from '@/core/domain/value-objects/money'

function toRecord(
  session: Prisma.CashRegisterSessionGetPayload<{
    include: {
      commissionCheckpoints: true
      user: true
      unit: { select: { organizationId: true } }
    }
  }>,
): CashSessionRecord {
  return {
    id: session.id,
    unitId: session.unitId,
    openedByUserId: session.openedById,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    openingAmount: Money.from(session.initialAmount),
    finalAmount: Money.from(session.finalAmount ?? session.initialAmount),
    commissionCheckpoints: session.commissionCheckpoints?.map((checkpoint) => ({
      profileId: checkpoint.profileId,
      totalBalance: Money.from(checkpoint.totalBalance ?? 0),
    })),
    user: session.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          unitId: session.user.unitId,
          organizationId: session.user.organizationId ?? null,
        }
      : undefined,
    unit: session.unit
      ? {
          organizationId: session.unit.organizationId,
        }
      : undefined,
  }
}

export class PrismaCashRegisterRepositoryAdapter
  implements CashRegisterRepositoryPort
{
  constructor(private readonly client = prisma) {}

  async create(data: CreateCashSessionInput, tx?: Prisma.TransactionClient) {
    const prismaClient = tx ?? this.client

    const created = await prismaClient.cashRegisterSession.create({
      data: {
        unit: { connect: { id: data.unitId } },
        user: { connect: { id: data.openedByUserId } },
        openedAt: data.openedAt ?? new Date(),
        initialAmount: data.openingAmount.toNumber(),
        finalAmount:
          data.finalAmount?.toNumber() ?? data.openingAmount.toNumber(),
        commissionCheckpoints: data.commissionCheckpoints
          ? {
              create: data.commissionCheckpoints.map((checkpoint) => ({
                profileId: checkpoint.profileId,
                totalBalance: checkpoint.totalBalance.toNumber(),
              })),
            }
          : undefined,
      },
      include: {
        commissionCheckpoints: true,
        user: true,
        unit: { select: { organizationId: true } },
      },
    })

    return toRecord(created)
  }

  async close(
    id: string,
    finalAmount: Money,
    closedAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx ?? this.client

    const updated = await prismaClient.cashRegisterSession.update({
      where: { id },
      data: {
        finalAmount: finalAmount.toNumber(),
        closedAt,
      },
      include: {
        commissionCheckpoints: true,
        user: true,
        unit: { select: { organizationId: true } },
      },
    })

    return toRecord(updated)
  }

  async findOpenByUnit(unitId: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx ?? this.client

    const session = await prismaClient.cashRegisterSession.findFirst({
      where: { unitId, closedAt: null },
      include: {
        commissionCheckpoints: true,
        user: true,
        unit: { select: { organizationId: true } },
      },
      orderBy: { openedAt: 'desc' },
    })

    if (!session) return null

    return toRecord(session)
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx ?? this.client

    const session = await prismaClient.cashRegisterSession.findUnique({
      where: { id },
      include: {
        commissionCheckpoints: true,
        user: true,
        unit: { select: { organizationId: true } },
      },
    })

    if (!session) return null

    return toRecord(session)
  }

  async findMany(
    filters: CashSessionFilters,
    tx?: Prisma.TransactionClient,
  ): Promise<CashSessionRecord[]> {
    const prismaClient = tx ?? this.client

    const sessions = await prismaClient.cashRegisterSession.findMany({
      where: {
        unitId: filters.unitId,
        unit: filters.organizationId
          ? { organizationId: filters.organizationId }
          : undefined,
      },
      orderBy: { openedAt: 'desc' },
      include: {
        commissionCheckpoints: true,
        user: true,
        unit: { select: { organizationId: true } },
      },
    })

    return sessions.map(toRecord)
  }

  async incrementFinalAmount(
    sessionId: string,
    amount: Money,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.client

    await prismaClient.cashRegisterSession.update({
      where: { id: sessionId },
      data: {
        finalAmount: {
          increment: amount.toNumber(),
        },
      },
    })
  }
}
