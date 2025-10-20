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
import { UpdateCashRegisterFinalAmountService } from '../../../src/services/cash-register/update-cash-register-final-amount'

import { prisma } from '../../../src/lib/prisma'
import { ReasonTransaction } from '@prisma/client'

import { PayUserCommissionService } from '../../../src/services/transaction/pay-user-comission'
import { PayUserLoansService } from '../../../src/services/loan/pay-user-loans'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
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
  const updateCashRegisterFinalAmountService =
    new UpdateCashRegisterFinalAmountService(cashRepo)
  const payUserCommissionService = new PayUserCommissionService(
    profileRepo,
    saleItemRepo,
    appRepo,
    incrementProfileService,
  )
  const payLoansService = new PayUserLoansService(loanRepo, unitRepo)

  const service = new WithdrawalBalanceTransactionService(
    barberRepo,
    cashRepo,
    saleItemRepo,
    payUserCommissionService,
    payLoansService,
    updateCashRegisterFinalAmountService,
    unitRepo,
    incrementUnitService,
  )

  return { service, profileRepo, unitRepo, transactionRepo, user, barberRepo }
}

describe('Withdrawal balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeAll(() => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn(prisma),
    )
  })

  beforeEach(() => {
    ctx = setup()
  })

  it('throws when passing negative value', async () => {
    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          description: '',
          amount: -5,
          reason: ReasonTransaction.PAY_COMMISSION,
        },
        ctx.user,
      ),
    ).rejects.toThrow('Negative values not allowed')
  })

  it('fails to withdraw when user balance is negative', async () => {
    ctx = setup({ userBalance: -20 })
    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          description: '',
          amount: 10,
          reason: ReasonTransaction.PAY_COMMISSION,
        },
        ctx.user,
      ),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(-20)
  })

  it('withdraws when user balance is positive', async () => {
    ctx = setup({ userBalance: 50 })
    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: ctx.user.id,
        description: '',
        amount: 20,
        reason: ReasonTransaction.PAY_COMMISSION,
      },
      ctx.user,
    )
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(30)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('fails withdrawal when balance insufficient and unit disallows loan', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: false })
    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          affectedUserId: 'user-1',
          description: '',
          amount: 30,
          reason: ReasonTransaction.PAY_COMMISSION,
        },
        ctx.user,
      ),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
  })

  it('fails withdrawal when amount exceeds unit balance', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 20, allowsLoan: true })
    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          description: '',
          amount: 50,
          reason: ReasonTransaction.PAY_COMMISSION,
        },
        ctx.user,
      ),
    ).rejects.toThrow('Insufficient balance for withdrawal')
    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
  })

  it('withdraws from another user with positive balance', async () => {
    ctx = setup()
    const profile = makeProfile('p3', 'u3', 50)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u3', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: other.id,
        description: '',
        amount: 30,
        reason: ReasonTransaction.PAY_COMMISSION,
      },
      ctx.user,
    )
    const updatedProfile = ctx.profileRepo.profiles.find(
      (p) => p.id === profile.id,
    )
    expect(updatedProfile?.totalBalance).toBe(20)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })
})
