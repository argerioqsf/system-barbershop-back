import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { PayBalanceUseCase } from '../../../src/modules/finance/application/use-cases/pay-balance'
import { PayUserLoansUseCase } from '../../../src/modules/finance/application/use-cases/pay-user-loans'
import { Money } from '../../../src/core/domain/value-objects/money'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  InMemoryCashRegisterRepositoryAdapter,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeAppointmentServiceRepository,
  FakeAppointmentRepository,
  FakeLoanRepository,
} from '../../helpers/fake-repositories'
import {
  defaultUser,
  defaultProfile,
  defaultUnit,
  makeProfile,
  makeUser,
  makeSaleWithBarber,
} from '../../helpers/default-values'
import { PayCommissionUseCase } from '../../../src/modules/finance/application/use-cases/pay-commission'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'
import { UpdateCashFinalAmountUseCase } from '../../../src/modules/finance/application/use-cases/update-cash-final-amount'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import { Prisma } from '@prisma/client'
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
import { CommissionCalculator } from '../../../src/modules/finance/domain/services/commission-calculator'

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashAdapter: InMemoryCashRegisterRepositoryAdapter
let cashRepo: FakeCashRegisterRepository
let loanRepo: FakeLoanRepository
let profileRepo: FakeProfilesRepository
let unitRepo: FakeUnitRepository
let saleItemRepo: FakeSaleItemRepository
let appointmentServiceRepo: FakeAppointmentServiceRepository

function setup(options?: { userBalance?: number; unitBalance?: number }) {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  cashAdapter = new InMemoryCashRegisterRepositoryAdapter(cashRepo)
  loanRepo = new FakeLoanRepository()
  const saleRepo = new FakeSaleRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  appointmentServiceRepo = new FakeAppointmentServiceRepository(appointmentRepo)
  profileRepo = new FakeProfilesRepository()
  const unit = { ...defaultUnit, totalBalance: options?.unitBalance ?? 0 }
  unitRepo = new FakeUnitRepository(unit)

  const profile = {
    ...defaultProfile,
    totalBalance: 0,
    user: { ...defaultUser },
  }
  profileRepo.profiles.push(profile)
  const user = { ...defaultUser, profile, unit }
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
  const commissionCalculator = new CommissionCalculator()
  const payCommissionUseCase = new PayCommissionUseCase(
    saleItemRepo,
    appointmentServiceRepo,
    incrementProfileService,
    commissionCalculator,
  )

  const incrementUnitService = new IncrementBalanceUnitService(unitRepo)
  const payUserLoansUseCase = new PayUserLoansUseCase(
    new LoanRepositoryAdapter(loanRepo),
    incrementUnitService,
  )
  const updateCashRegisterFinalAmountUseCase = new UpdateCashFinalAmountUseCase(
    cashAdapter,
  )

  const useCase = new PayBalanceUseCase(
    barberRepo,
    cashAdapter,
    payCommissionUseCase,
    payUserLoansUseCase,
    updateCashRegisterFinalAmountUseCase,
    defaultTransactionRunner,
  )

  return {
    useCase,
    profileRepo,
    unitRepo,
    transactionRepo,
    user,
    barberRepo,
    saleRepo,
    saleItemRepo,
    appointmentServiceRepo,
    appointmentRepo,
    loanRepo,
  }
}

describe('PayBalanceUseCase', () => {
  let ctx: ReturnType<typeof setup>

  beforeAll(() => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn(prisma),
    )
  })

  beforeEach(() => {
    ctx = setup({ unitBalance: 100 })
  })

  it('lança erro quando o valor a pagar excede o saldo do usuário', async () => {
    const profile = makeProfile('p2', 'u2', 10)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u2', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-over',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-over'
    sale.items[0].serviceId = 'svc-over'
    sale.items[0].price = 10
    sale.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        affectedUserId: other.id,
        description: '',
        amount: Money.from(20),
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
  })

  it('paga usuário com saldo positivo', async () => {
    const profile = makeProfile('p3', 'u3', 40)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u3', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-pay',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-pay'
    sale.items[0].serviceId = 'svc-pay'
    sale.items[0].price = 40
    sale.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: other.id,
      description: '',
      amount: Money.from(30),
    })

    const updatedProfile = ctx.profileRepo.profiles.find(
      (p) => p.id === profile.id,
    )
    expect(updatedProfile?.totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('distribui pagamento pelos itens pendentes', async () => {
    const profile = makeProfile('p4', 'u4', 20)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u4', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const sale1 = {
      ...makeSaleWithBarber(),
      id: 's1',
      paymentStatus: 'PAID',
      createdAt: new Date('2024-01-01'),
    }
    sale1.items[0].barberId = other.id
    sale1.items[0].id = 'it1'
    sale1.items[0].serviceId = 'svc1'
    sale1.items[0].price = 10
    sale1.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale1.items[0] as any).commissionPaid = false
    const sale2 = {
      ...makeSaleWithBarber(),
      id: 's2',
      paymentStatus: 'PAID',
      createdAt: new Date('2024-01-02'),
    }
    sale2.items[0].barberId = other.id
    sale2.items[0].id = 'it2'
    sale2.items[0].serviceId = 'svc2'
    sale2.items[0].price = 10
    sale2.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale2.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale1 as any, sale2 as any)

    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: other.id,
      description: '',
      saleItemIds: ['it1', 'it2'],
    })

    expect(ctx.transactionRepo.transactions).toHaveLength(2)
    const updatedProfile = ctx.profileRepo.profiles.find(
      (p) => p.id === profile.id,
    )
    expect(updatedProfile?.totalBalance).toBe(0)
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
