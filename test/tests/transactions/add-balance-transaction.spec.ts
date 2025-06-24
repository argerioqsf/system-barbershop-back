import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AddBalanceTransactionService } from '../../../src/services/transaction/add-balance-transaction'
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

  const service = new AddBalanceTransactionService(
    transactionRepo,
    barberRepo,
    cashRepo,
    profileRepo,
    unitRepo,
    organizationRepo,
  )

  return { service, profileRepo, unitRepo, transactionRepo, user, barberRepo }
}

describe('Add balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('throws when passing negative value', async () => {
    await expect(
      ctx.service.execute({
        userId: ctx.user.id,
        description: '',
        amount: -10,
      }),
    ).rejects.toThrow('Negative values ​​cannot be passed on withdrawals')
  })

  it('adds value to user with negative balance', async () => {
    ctx = setup({ userBalance: -50 })
    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: ctx.user.id,
      description: '',
      amount: 60,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(60)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
  })

  it('adds value to user with positive balance', async () => {
    ctx = setup({ userBalance: 20 })
    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: ctx.user.id,
      description: '',
      amount: 30,
    })
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(50)
    expect(ctx.unitRepo.unit.totalBalance).toBe(0)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('adds value without affected user increases unit', async () => {
    await ctx.service.execute({
      userId: ctx.user.id,
      description: '',
      amount: 40,
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

    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      description: '',
      amount: 20,
    })
    expect(profile.totalBalance).toBe(-10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
  })
})
