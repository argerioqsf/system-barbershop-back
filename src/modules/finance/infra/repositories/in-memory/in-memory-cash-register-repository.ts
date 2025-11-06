import { InMemoryCashRegisterRepository as LegacyRepository } from '@/repositories/in-memory/in-memory-cash-register-repository'
import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
  CashSessionFilters,
  CreateCashSessionInput,
} from '@/modules/finance/application/ports/cash-register-repository'
import { Money } from '@/core/domain/value-objects/money'
import { Prisma } from '@prisma/client'

type LegacySessionSnapshot = {
  id: string
  openedById: string
  unitId: string
  openedAt: Date
  closedAt: Date | null
  initialAmount: number
  finalAmount: number | null
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: number | null
  }>
  user?: {
    id: string
    name: string
    email: string
    unitId: string
    organizationId?: string | null
  }
  unit?: {
    organizationId?: string
  }
}

function toRecord(session: LegacySessionSnapshot): CashSessionRecord {
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

export class InMemoryCashRegisterRepositoryAdapter
  implements CashRegisterRepositoryPort
{
  constructor(public readonly legacy = new LegacyRepository()) {}

  async create(data: CreateCashSessionInput): Promise<CashSessionRecord> {
    const session = await this.legacy.create({
      user: { connect: { id: data.openedByUserId } },
      unit: { connect: { id: data.unitId } },
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
    } as Prisma.CashRegisterSessionCreateInput)

    return toRecord({
      id: session.id,
      openedById: session.openedById,
      unitId: session.unitId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmount: session.initialAmount,
      finalAmount: session.finalAmount,
    })
  }

  async close(id: string, finalAmount: Money, closedAt: Date) {
    const session = await this.legacy.close(id, {
      finalAmount: finalAmount.toNumber(),
      closedAt,
    })

    return toRecord({
      id: session.id,
      openedById: session.openedById,
      unitId: session.unitId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmount: session.initialAmount,
      finalAmount: session.finalAmount,
    })
  }

  async findOpenByUnit(unitId: string) {
    const session = await this.legacy.findOpenByUnit(unitId)
    if (!session) return null
    return toRecord({
      id: session.id,
      openedById: session.openedById,
      unitId: session.unitId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmount: session.initialAmount,
      finalAmount: session.finalAmount,
      commissionCheckpoints: session.commissionCheckpoints?.map(
        (checkpoint) => ({
          profileId: checkpoint.profileId,
          totalBalance: checkpoint.totalBalance,
        }),
      ),
    })
  }

  async findById(id: string) {
    const session = await this.legacy.findById(id)
    if (!session) return null
    return toRecord({
      id: session.id,
      openedById: session.openedById,
      unitId: session.unitId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmount: session.initialAmount,
      finalAmount: session.finalAmount,
      user: session.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            unitId: session.user.unitId,
            organizationId: session.user.organizationId ?? null,
          }
        : undefined,
    })
  }

  async findMany(filters: CashSessionFilters): Promise<CashSessionRecord[]> {
    const where: Prisma.CashRegisterSessionWhereInput = {
      unitId: filters.unitId,
      unit: filters.organizationId
        ? { organizationId: filters.organizationId }
        : undefined,
    }

    const sessions = await this.legacy.findMany(where)
    return sessions.map((session) =>
      toRecord({
        id: session.id,
        openedById: session.openedById,
        unitId: session.unitId,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        initialAmount: session.initialAmount,
        finalAmount: session.finalAmount,
        commissionCheckpoints: undefined,
        user: session.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              unitId: session.user.unitId,
              organizationId: session.user.organizationId ?? null,
            }
          : undefined,
      }),
    )
  }

  async incrementFinalAmount(
    sessionId: string,
    amount: Money,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.legacy.incrementFinalAmount(sessionId, amount.toNumber(), tx)
  }
}
