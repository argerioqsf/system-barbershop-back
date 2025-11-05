import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AddBalanceUseCase } from '../../../src/modules/finance/application/use-cases/add-balance'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  InMemoryCashRegisterRepositoryAdapter,
  FakeProfilesRepository,
  FakeUnitRepository,
} from '../../helpers/fake-repositories'
import {
  defaultUser,
  defaultProfile,
  defaultUnit,
  makeProfile,
  makeUser,
} from '../../helpers/default-values'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'
import { UpdateCashFinalAmountUseCase } from '../../../src/modules/finance/application/use-cases/update-cash-final-amount'
import { ReasonTransaction, Prisma } from '@prisma/client'
import { Money } from '../../../src/core/domain/value-objects/money'
import { TransactionRunner } from '../../../src/core/application/ports/transaction-runner'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let cashAdapter: InMemoryCashRegisterRepositoryAdapter
let profileRepo: FakeProfilesRepository
let unitRepo: FakeUnitRepository

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
  const unit = {
    ...defaultUnit,
    totalBalance: options?.unitBalance ?? 0,
    allowsLoan: options?.allowsLoan ?? defaultUnit.allowsLoan,
  }
  unitRepo = new FakeUnitRepository(unit)
  const profile = {
    ...defaultProfile,
    totalBalance: options?.userBalance ?? 0,
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
  const incrementUnitService = new IncrementBalanceUnitService(unitRepo)
  const updateCashRegisterFinalAmountUseCase = new UpdateCashFinalAmountUseCase(
    cashAdapter,
  )

  const transactionRunner: TransactionRunner = {
    run: async (handler) =>
      handler(undefined as unknown as Prisma.TransactionClient),
  }

  const useCase = new AddBalanceUseCase(
    barberRepo,
    cashAdapter,
    incrementProfileService,
    incrementUnitService,
    updateCashRegisterFinalAmountUseCase,
    transactionRunner,
  )

  return { useCase, profileRepo, unitRepo, transactionRepo, user, barberRepo }
}

describe('Add balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('throws when passing negative value', async () => {
    await expect(
      ctx.useCase.execute({
        actorId: ctx.user.id,
        unitId: ctx.unitRepo.unit.id,
        description: '',
        amount: Money.from(-10),
        reason: ReasonTransaction.ADD_COMMISSION,
      }),
    ).rejects.toThrow('Negative values cannot be passed on withdrawals')
  })

  it('adds value to user with negative balance', async () => {
    ctx = setup({ userBalance: -50 })
    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: ctx.user.id,
      description: '',
      amount: Money.from(60),
      reason: ReasonTransaction.ADD_COMMISSION,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(50)
    expect(ctx.transactionRepo.transactions).toHaveLength(3)
  })

  it('adds value to user with positive balance', async () => {
    ctx = setup({ userBalance: 20 })
    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: ctx.user.id,
      description: '',
      amount: Money.from(30),
      reason: ReasonTransaction.ADD_COMMISSION,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(50)
    expect(ctx.unitRepo.unit.totalBalance).toBe(0)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('adds value without affected user increases unit', async () => {
    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      description: '',
      amount: Money.from(40),
      reason: ReasonTransaction.ADD_COMMISSION,
    })
    expect(ctx.unitRepo.unit.totalBalance).toBe(40)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('adds value to another user with negative balance', async () => {
    ctx = setup()
    const profile = makeProfile('p2', 'u2', -30)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u2', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.useCase.execute({
      actorId: ctx.user.id,
      unitId: ctx.unitRepo.unit.id,
      affectedUserId: other.id,
      description: '',
      amount: Money.from(20),
      reason: ReasonTransaction.ADD_COMMISSION,
    })
    const updatedProfile = ctx.profileRepo.profiles.find(
      (p) => p.id === profile.id,
    )
    expect(updatedProfile?.totalBalance).toBe(-10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
  })
})
