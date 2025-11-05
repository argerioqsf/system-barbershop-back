/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma, Transaction } from '@prisma/client'
import { PayUserLoansUseCase } from '@/modules/finance/application/use-cases/pay-user-loans'
import { PrismaLoansRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-loans-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { Money } from '@/core/domain/value-objects/money'
import { UserFindById } from '@/repositories/barber-users-repository'
import {
  LoansRepositoryPort,
  LoanRecord,
  LoanWithTransactionsRecord,
  LoanQueryFilters,
  LoanUpdateData,
  CreateLoanInput,
} from '@/modules/finance/application/ports/loans-repository'
import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { UnitRepository } from '@/repositories/unit-repository'

interface PayUserLoansRequest {
  affectedUser: NonNullable<UserFindById>
  amount: number
}

interface PayUserLoansResponse {
  transactions: Transaction[]
  remaining: number
  totalPaid: number
}

export class PayUserLoansService {
  // TODO: Remover este adapter legado assim que todos os fluxos passarem a usar o PayUserLoansUseCase diretamente.
  private readonly useCase: PayUserLoansUseCase

  constructor(
    loansRepository: LoansRepositoryPort = new PrismaLoansRepositoryAdapter(),
    incrementUnitService: IncrementBalanceUnitService = new IncrementBalanceUnitService(
      new PrismaUnitRepository(),
    ),
  ) {
    this.useCase = new PayUserLoansUseCase(
      loansRepository,
      incrementUnitService,
    )
  }

  async execute(
    { affectedUser, amount }: PayUserLoansRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserLoansResponse> {
    const result = await this.useCase.execute({
      affectedUser,
      amount: Money.from(amount),
      tx,
    })

    return {
      transactions: result.transactions,
      remaining: result.remaining.toNumber(),
      totalPaid: result.totalPaid.toNumber(),
    }
  }
}

export class LoanRepositoryAdapter implements LoansRepositoryPort {
  constructor(private readonly repo: LoanRepository) {}

  async create(
    _data: CreateLoanInput,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    return Promise.reject(new Error('Legacy adaptor does not support create'))
  }

  async findById(
    id: string,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord | null> {
    const loan = await this.repo.findById(id)
    return loan ? convertLoan(loan) : null
  }

  async findMany(
    filters: LoanQueryFilters = {},
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord[]> {
    const where: Prisma.LoanWhereInput = {
      userId: filters.userId ? { equals: filters.userId } : undefined,
      unitId: filters.unitId ? { equals: filters.unitId } : undefined,
      status: filters.status ? { equals: filters.status } : undefined,
    }

    const loans = await this.repo.findMany(where)
    return loans.map(convertLoan)
  }

  async update(
    id: string,
    data: LoanUpdateData,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    const updated = await this.repo.update(id, {
      status: data.status,
      paidAt: data.paidAt ?? undefined,
      updatedById: data.updatedById ?? undefined,
    })

    const current = await this.repo.findById(id)
    const merged: LoanWithTransactions = {
      ...updated,
      transactions: current?.transactions ?? [],
    }

    return toLoanRecord(merged)
  }
}

function convertLoan(loan: LoanWithTransactions): LoanWithTransactionsRecord {
  return {
    id: loan.id,
    unitId: loan.unitId,
    userId: loan.userId,
    sessionId: loan.sessionId,
    amount: Money.from(loan.amount),
    status: loan.status as LoanStatus,
    createdAt: loan.createdAt,
    paidAt: loan.paidAt,
    updatedById: loan.updatedById ?? null,
    transactions: loan.transactions.map((tx) => ({
      id: tx.id,
      amount: Money.from(tx.amount),
      createdAt: tx.createdAt,
    })),
  }
}

function toLoanRecord(loan: LoanWithTransactions): LoanRecord {
  return {
    id: loan.id,
    unitId: loan.unitId,
    userId: loan.userId,
    sessionId: loan.sessionId,
    amount: Money.from(loan.amount),
    status: loan.status as LoanStatus,
    createdAt: loan.createdAt,
    paidAt: loan.paidAt,
    updatedById: loan.updatedById ?? null,
  }
}
