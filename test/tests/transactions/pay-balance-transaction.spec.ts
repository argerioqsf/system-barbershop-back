import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayBalanceTransactionService } from '../../../src/services/transaction/pay-balance-transaction'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
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

function setup(options?: { userBalance?: number; unitBalance?: number }) {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profileRepo = new FakeProfilesRepository()
  const unit = { ...defaultUnit, totalBalance: options?.unitBalance ?? 0 }
  const unitRepo = new FakeUnitRepository(unit)

  const profile = { ...defaultProfile, totalBalance: 0, user: { ...defaultUser } }
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

  const service = new PayBalanceTransactionService(
    transactionRepo,
    barberRepo,
    cashRepo,
    profileRepo,
  )

  return { service, profileRepo, unitRepo, transactionRepo, user, barberRepo }
}

describe('Pay balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup({ unitBalance: 100 })
  })

  it('throws when paying more than user balance', async () => {
    const profile = makeProfile('p2', 'u2', 10)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u2', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await expect(
      ctx.service.execute({
        userId: ctx.user.id,
        affectedUserId: other.id,
        description: '',
        amount: 20,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')
  })

  it('pays user with positive balance', async () => {
    const profile = makeProfile('p3', 'u3', 40)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u3', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      description: '',
      amount: 30,
    })

    expect(profile.totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })
})
