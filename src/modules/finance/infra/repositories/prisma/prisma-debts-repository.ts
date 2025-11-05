import { prisma } from '@/lib/prisma'
import {
  Prisma,
  PaymentStatus as PrismaPaymentStatus,
  Debt as PrismaDebt,
} from '@prisma/client'
import {
  DebtsRepositoryPort,
  CreateDebtInput,
  DebtRecord,
  DebtUpdateData,
  DebtQueryFilters,
  DebtPagination,
} from '@/modules/finance/application/ports/debts-repository'
import type { DebtStatus } from '@/modules/finance/domain/types/status'
import { Money } from '@/core/domain/value-objects/money'

const prismaStatusByDomain: Record<DebtStatus, PrismaPaymentStatus> = {
  PAID: PrismaPaymentStatus.PAID,
  PENDING: PrismaPaymentStatus.PENDING,
}

export function toPrismaDebtStatus(status: DebtStatus): PrismaPaymentStatus {
  return prismaStatusByDomain[status]
}

export function fromPrismaDebtStatus(status: PrismaPaymentStatus): DebtStatus {
  switch (status) {
    case PrismaPaymentStatus.PAID:
      return 'PAID'
    case PrismaPaymentStatus.PENDING:
    default:
      return 'PENDING'
  }
}

function toDebtRecord(debt: PrismaDebt): DebtRecord {
  return {
    id: debt.id,
    planId: debt.planId,
    planProfileId: debt.planProfileId,
    amount: Money.from(debt.value),
    status: fromPrismaDebtStatus(debt.status),
    dueDate: debt.dueDate,
    paymentDate: debt.paymentDate ?? null,
    createdAt: debt.createdAt,
  }
}

export class PrismaDebtsRepositoryAdapter implements DebtsRepositoryPort {
  constructor(private readonly client = prisma) {}

  async create(
    data: CreateDebtInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DebtRecord> {
    const prismaClient = tx ?? this.client

    const created = await prismaClient.debt.create({
      data: {
        planId: data.planId,
        planProfileId: data.planProfileId,
        value: data.amount.toNumber(),
        status: toPrismaDebtStatus(data.status ?? 'PENDING'),
        paymentDate: data.paymentDate ?? null,
        dueDate: data.dueDate,
        createdAt: data.createdAt ?? new Date(),
      },
    })

    return toDebtRecord(created)
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DebtRecord | null> {
    const prismaClient = tx ?? this.client
    const debt = await prismaClient.debt.findUnique({ where: { id } })
    return debt ? toDebtRecord(debt) : null
  }

  async findMany(
    filters: DebtQueryFilters = {},
    pagination?: DebtPagination,
    tx?: Prisma.TransactionClient,
  ): Promise<DebtRecord[]> {
    const prismaClient = tx ?? this.client

    const createdAtFilter =
      filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ?? undefined,
            lte: filters.createdTo ?? undefined,
          }
        : undefined

    const debts = await prismaClient.debt.findMany({
      where: {
        planId: filters.planId,
        planProfileId: filters.planProfileId,
        status: filters.status ? toPrismaDebtStatus(filters.status) : undefined,
        createdAt: createdAtFilter,
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination ? (pagination.page - 1) * pagination.perPage : undefined,
      take: pagination ? pagination.perPage : undefined,
    })

    return debts.map(toDebtRecord)
  }

  async count(
    filters: DebtQueryFilters = {},
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prismaClient = tx ?? this.client

    const createdAtFilter =
      filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ?? undefined,
            lte: filters.createdTo ?? undefined,
          }
        : undefined

    return prismaClient.debt.count({
      where: {
        planId: filters.planId,
        planProfileId: filters.planProfileId,
        status: filters.status ? toPrismaDebtStatus(filters.status) : undefined,
        createdAt: createdAtFilter,
      },
    })
  }

  async update(
    id: string,
    data: DebtUpdateData,
    tx?: Prisma.TransactionClient,
  ): Promise<DebtRecord> {
    const prismaClient = tx ?? this.client

    const updated = await prismaClient.debt.update({
      where: { id },
      data: {
        value: data.amount ? data.amount.toNumber() : undefined,
        status: data.status ? toPrismaDebtStatus(data.status) : undefined,
        paymentDate: data.paymentDate ?? undefined,
        dueDate: data.dueDate ?? undefined,
      },
    })

    return toDebtRecord(updated)
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = tx ?? this.client
    await prismaClient.debt.delete({ where: { id } })
  }
}
