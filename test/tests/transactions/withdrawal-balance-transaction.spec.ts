import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { WithdrawBalanceUseCase } from '../../../src/modules/finance/application/use-cases/withdraw-balance'
import { PayUserLoansUseCase } from '../../../src/modules/finance/application/use-cases/pay-user-loans'
import { Money } from '../../../src/core/domain/value-objects/money'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  InMemoryCashRegisterRepositoryAdapter,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeOrganizationRepository,
  FakeSaleItemRepository,
  FakeSaleRepository,
  FakeLoanRepository,
  FakeAppointmentRepository,
} from '../../helpers/fake-repositories'
import {
  defaultUser,
  defaultProfile,
  defaultUnit,
  defaultOrganization,
  makeProfile,
  makeUser,
  makeSaleWithBarber,
} from '../../helpers/default-values'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'
import { UpdateCashFinalAmountUseCase } from '../../../src/modules/finance/application/use-cases/update-cash-final-amount'
import { Prisma, ReasonTransaction } from '@prisma/client'
import {
  LoansRepositoryPort,
  LoanRecord,
  LoanWithTransactionsRecord,
  LoanQueryFilters,
  LoanUpdateData,
  CreateLoanInput,
} from '../../../src/modules/finance/application/ports/loans-repository'
import {
  LoanRepository,
  LoanWithTransactions,
} from '../../../src/repositories/loan-repository'
import { LoanStatus } from '../../../src/modules/finance/domain/types/status'
import { defaultTransactionRunner } from '../../../src/infra/prisma/transaction-runner'
import { prisma } from '../../../src/lib/prisma'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import { TransactionReason } from '../../../src/modules/finance/domain/entities/transaction'
import { PayCommissionUseCase } from '../../../src/modules/finance/application/use-cases/pay-commission'
import { CommissionCalculator } from '../../../src/modules/finance/domain/services/commission-calculator'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashAdapter: InMemoryCashRegisterRepositoryAdapter
let cashRepo: FakeCashRegisterRepository
let profileRepo: FakeProfilesRepository
let unitRepo: FakeUnitRepository
let saleItemRepo: FakeSaleItemRepository
let saleRepo: FakeSaleRepository
let loanRepo: FakeLoanRepository
let appRepo: FakeAppointmentRepository

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

function setup(options?: {
  userBalance?: number
  unitBalance?: number
  allowsLoan?: boolean
}) {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  cashAdapter = new InMemoryCashRegisterRepositoryAdapter(cashRepo)
  profileRepo = new FakeProfilesRepository()
  saleRepo = new FakeSaleRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  loanRepo = new FakeLoanRepository()
  appRepo = new FakeAppointmentRepository()
  const unit = {
    ...defaultUnit,
    totalBalance: options?.unitBalance ?? 0,
    allowsLoan: options?.allowsLoan ?? defaultUnit.allowsLoan,
  }
  unitRepo = new FakeUnitRepository(unit)
  unitRepo.findById = vi.fn().mockResolvedValue(unit)
  saleItemRepo.findManyPendingCommission = vi
    .fn()
    .mockImplementation(async (userId: string) => {
      const profile = profileRepo.profiles.find((p) => p.userId === userId)
      if (!profile || profile.totalBalance <= 0) {
        return []
      }

      const sale = makeSaleWithBarber()
      sale.items[0].price = profile.totalBalance
      sale.items[0].porcentagemBarbeiro = 100
      const itemWithSale = { ...sale.items[0], sale }
      return [itemWithSale] as any
    })
  const organizationRepo = new FakeOrganizationRepository(defaultOrganization)

  const profile = {
    ...defaultProfile,
    totalBalance: options?.userBalance ?? 0,
    user: { ...defaultUser, email: 'user@email.com' },
  }
  profileRepo.profiles.push(profile)
  const user = { ...defaultUser, sub: defaultUser.id, profile, unit }
  barberRepo.users.push(user)

  cashRepo.session = {
    id: 'session-1',
    openedById: user.id,
    unitId: unit.id,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    transactions: [],
    sales: [],
    finalAmount: null,
    user: defaultUser,
  }

  const incrementProfileService = new IncrementBalanceProfileService(
    profileRepo,
  )
  const incrementUnitService = new IncrementBalanceUnitService(unitRepo)
  const commissionCalculator = new CommissionCalculator()
  const payCommissionUseCase = new PayCommissionUseCase(
    saleItemRepo,
    appRepo,
    incrementProfileService,
    commissionCalculator,
  )
  const payLoansUseCase = new PayUserLoansUseCase(
    new LoanRepositoryAdapter(loanRepo),
    incrementUnitService,
  )
  const updateCashRegisterFinalAmountUseCase = new UpdateCashFinalAmountUseCase(
    cashAdapter,
  )

  const useCase = new WithdrawBalanceUseCase(
    barberRepo,
    cashAdapter,
    payCommissionUseCase,
    payLoansUseCase,
    updateCashRegisterFinalAmountUseCase,
    unitRepo,
    incrementUnitService,
    defaultTransactionRunner,
  )

  return {
    useCase,
    profileRepo,
    unitRepo,
    transactionRepo,
    user,
    barberRepo,
    saleItemRepo,
  }
}

describe('WithdrawBalanceUseCase', () => {
  let ctx: ReturnType<typeof setup>

  beforeAll(() => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn(prisma),
    )
  })

  beforeEach(() => {
    ctx = setup()
  })

  it('lança erro para valores negativos', async () => {
    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        amount: Money.from(-5),
        reason: TransactionReason.PAY_COMMISSION,
      }),
    ).rejects.toThrow('Negative values cannot be passed on withdrawals')
  })

  it('impede retirada quando o valor excede o saldo do usuário', async () => {
    ctx = setup({ userBalance: 20 })
    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        affectedUserId: ctx.user.id,
        amount: Money.from(30),
        reason: TransactionReason.PAY_COMMISSION,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(20)
  })

  it('permite retirada quando o usuário possui saldo positivo', async () => {
    ctx = setup({ userBalance: 50 })
    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: ctx.user.id,
      amount: Money.from(20),
      reason: TransactionReason.PAY_COMMISSION,
    })

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(30)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('impede retirada acima do saldo quando a unidade não permite empréstimo', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: false })
    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        affectedUserId: 'user-1',
        amount: Money.from(30),
        reason: TransactionReason.PAY_COMMISSION,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
  })

  it('falha quando o valor excede o saldo da unidade', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 20, allowsLoan: true })
    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        amount: Money.from(50),
        reason: TransactionReason.PAY_COMMISSION,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
  })

  it('retira saldo de outro usuário com saldo positivo', async () => {
    ctx = setup({ userBalance: 0 })
    const profile = makeProfile('p3', 'u3', 50)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u3', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: other.id,
      amount: Money.from(30),
      reason: TransactionReason.PAY_COMMISSION,
    })
    const updatedProfile = ctx.profileRepo.profiles.find(
      (p) => p.id === profile.id,
    )
    expect(updatedProfile?.totalBalance).toBe(20)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })
})

class LoanRepositoryAdapter implements LoansRepositoryPort {
  constructor(private readonly repo: LoanRepository) {}

  async create(
    _data: CreateLoanInput,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    return Promise.reject(new Error('not implemented'))
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
      status: filters.status ? { equals: filters.status as any } : undefined,
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
      status: data.status as any,
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
