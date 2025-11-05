import { prisma } from '@/lib/prisma'
import {
  Prisma,
  LoanStatus as PrismaLoanStatus,
  Transaction as PrismaTransaction,
} from '@prisma/client'
import {
  LoansRepositoryPort,
  CreateLoanInput,
  LoanRecord,
  LoanWithTransactionsRecord,
  LoanUpdateData,
  LoanQueryFilters,
  LoanTransactionRecord,
} from '@/modules/finance/application/ports/loans-repository'
import type { LoanStatus } from '@/modules/finance/domain/types/status'
import { Money } from '@/core/domain/value-objects/money'

const prismaStatusByDomain: Record<LoanStatus, PrismaLoanStatus> = {
  PENDING: PrismaLoanStatus.PENDING,
  APPROVED: PrismaLoanStatus.APPROVED,
  REJECTED: PrismaLoanStatus.REJECTED,
  CANCELED: PrismaLoanStatus.CANCELED,
  VALUE_TRANSFERRED: PrismaLoanStatus.VALUE_TRANSFERRED,
  PAID_OFF: PrismaLoanStatus.PAID_OFF,
}

export function toPrismaLoanStatus(status: LoanStatus): PrismaLoanStatus {
  return prismaStatusByDomain[status]
}

export function fromPrismaLoanStatus(status: PrismaLoanStatus): LoanStatus {
  switch (status) {
    case PrismaLoanStatus.PENDING:
      return 'PENDING'
    case PrismaLoanStatus.APPROVED:
      return 'APPROVED'
    case PrismaLoanStatus.REJECTED:
      return 'REJECTED'
    case PrismaLoanStatus.CANCELED:
      return 'CANCELED'
    case PrismaLoanStatus.VALUE_TRANSFERRED:
      return 'VALUE_TRANSFERRED'
    case PrismaLoanStatus.PAID_OFF:
      return 'PAID_OFF'
    default:
      return 'PENDING'
  }
}

function toLoanTransactionRecord(
  transaction: PrismaTransaction,
): LoanTransactionRecord {
  return {
    id: transaction.id,
    amount: Money.from(transaction.amount),
    createdAt: transaction.createdAt,
  }
}

function toLoanRecord(
  loan: Prisma.LoanGetPayload<{ include: { transactions: true } }>,
): LoanWithTransactionsRecord {
  return {
    id: loan.id,
    unitId: loan.unitId,
    userId: loan.userId,
    sessionId: loan.sessionId,
    amount: Money.from(loan.amount),
    status: fromPrismaLoanStatus(loan.status),
    createdAt: loan.createdAt,
    paidAt: loan.paidAt ?? null,
    updatedById: loan.updatedById ?? null,
    transactions: loan.transactions.map(toLoanTransactionRecord),
  }
}

export class PrismaLoansRepositoryAdapter implements LoansRepositoryPort {
  constructor(private readonly client = prisma) {}

  async create(
    data: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    const prismaClient = tx ?? this.client

    const created = await prismaClient.loan.create({
      data: {
        unitId: data.unitId,
        userId: data.userId,
        sessionId: data.sessionId,
        amount: data.amount.toNumber(),
        status: toPrismaLoanStatus(data.status ?? 'PENDING'),
        createdAt: data.createdAt ?? new Date(),
        paidAt: data.paidAt ?? null,
        updatedById: data.updatedById ?? null,
      },
    })

    return {
      id: created.id,
      unitId: created.unitId,
      userId: created.userId,
      sessionId: created.sessionId,
      amount: Money.from(created.amount),
      status: fromPrismaLoanStatus(created.status),
      createdAt: created.createdAt,
      paidAt: created.paidAt ?? null,
      updatedById: created.updatedById ?? null,
    }
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord | null> {
    const prismaClient = tx ?? this.client

    const loan = await prismaClient.loan.findUnique({
      where: { id },
      include: { transactions: true },
    })

    return loan ? toLoanRecord(loan) : null
  }

  async findMany(
    filters: LoanQueryFilters = {},
    tx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord[]> {
    const prismaClient = tx ?? this.client

    const loans = await prismaClient.loan.findMany({
      where: {
        userId: filters.userId,
        unitId: filters.unitId,
        status: filters.status ? toPrismaLoanStatus(filters.status) : undefined,
      },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    })

    return loans.map(toLoanRecord)
  }

  async update(
    id: string,
    data: LoanUpdateData,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    const prismaClient = tx ?? this.client

    const updated = await prismaClient.loan.update({
      where: { id },
      data: {
        status: data.status ? toPrismaLoanStatus(data.status) : undefined,
        paidAt: data.paidAt,
        updatedById: data.updatedById ?? undefined,
      },
    })

    return {
      id: updated.id,
      unitId: updated.unitId,
      userId: updated.userId,
      sessionId: updated.sessionId,
      amount: Money.from(updated.amount),
      status: fromPrismaLoanStatus(updated.status),
      createdAt: updated.createdAt,
      paidAt: updated.paidAt ?? null,
      updatedById: updated.updatedById ?? null,
    }
  }
}
