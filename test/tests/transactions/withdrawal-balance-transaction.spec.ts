import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { WithdrawalBalanceTransactionService } from '../../../src/services/transaction/withdrawal-balance-transaction'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeOrganizationRepository,
} from '../../helpers/fake-repositories'
import {
  defaultUser,
  defaultProfile,
  defaultUnit,
  defaultOrganization,
  makeProfile,
  makeUser,
} from '../../helpers/default-values'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository

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
  const profileRepo = new FakeProfilesRepository()
  const unit = {
    ...defaultUnit,
    totalBalance: options?.unitBalance ?? 0,
    allowsLoan: options?.allowsLoan ?? defaultUnit.allowsLoan,
  }
  const unitRepo = new FakeUnitRepository(unit)
  const organizationRepo = new FakeOrganizationRepository(defaultOrganization)

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

  const service = new WithdrawalBalanceTransactionService(
    barberRepo,
    cashRepo,
    profileRepo,
    unitRepo,
  )

  return { service, profileRepo, unitRepo, transactionRepo, user, barberRepo }
}

import { prisma } from '../../../src/lib/prisma'

describe('Withdrawal balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeAll(() => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn(prisma))
  })

  beforeEach(() => {
    ctx = setup()
  })

  it('throws when passing negative value', async () => {
    await expect(
      ctx.service.execute({ userId: ctx.user.id, description: '', amount: -5 }),
    ).rejects.toThrow('Negative values ​​cannot be passed on withdrawals')
  })

  it('fails to withdraw when user balance is negative', async () => {
    ctx = setup({ userBalance: -20 })
    await expect(
      ctx.service.execute({ userId: ctx.user.id, description: '', amount: 10 }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(-20)
  })

  it('withdraws when user balance is positive', async () => {
    ctx = setup({ userBalance: 50 })
    await ctx.service.execute({
      userId: ctx.user.id,
      description: '',
      amount: 20,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(30)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('withdraws with loan when balance insufficient and unit allows', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: true })
    await ctx.service.execute({
      userId: ctx.user.id,
      description: '',
      amount: 30,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(-20)
    expect(ctx.unitRepo.unit.totalBalance).toBe(80)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
  })

  it('fails withdrawal when balance insufficient and unit disallows loan', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: false })
    await expect(
      ctx.service.execute({ userId: ctx.user.id, description: '', amount: 30 }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
  })

  it('fails withdrawal when amount exceeds unit balance', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 20, allowsLoan: true })
    await expect(
      ctx.service.execute({ userId: ctx.user.id, description: '', amount: 50 }),
    ).rejects.toThrow('Withdrawal amount greater than unit balance')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
  })

  it('withdraws from another user with positive balance', async () => {
    ctx = setup()
    const profile = makeProfile('p3', 'u3', 50)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u3', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      description: '',
      amount: 30,
    })
    expect(profile.totalBalance).toBe(20)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('withdraws from another user with negative balance', async () => {
    ctx = setup({ unitBalance: 100, allowsLoan: true })
    const profile = makeProfile('p4', 'u4', -10)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u4', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      description: '',
      amount: 20,
    })
    expect(profile.totalBalance).toBe(-30)
    expect(ctx.unitRepo.unit.totalBalance).toBe(80)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
  })
})
