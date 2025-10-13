import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { PayBalanceTransactionService } from '../../../src/services/transaction/pay-balance-transaction'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
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
import { PayUserCommissionService } from '../../../src/services/transaction/pay-user-comission'
import { PayUserLoansService } from '../../../src/services/loan/pay-user-loans'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'
import { UpdateCashRegisterFinalAmountService } from '../../../src/services/cash-register/update-cash-register-final-amount'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let loanRepo: FakeLoanRepository
let profileRepo: FakeProfilesRepository
let unitRepo: FakeUnitRepository
let saleItemRepo: FakeSaleItemRepository
let appointmentServiceRepo: FakeAppointmentServiceRepository

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
  loanRepo = new FakeLoanRepository()
  const saleRepo = new FakeSaleRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  appointmentServiceRepo = new FakeAppointmentServiceRepository(
    appointmentRepo,
  )
  profileRepo = new FakeProfilesRepository()
  const unit = { ...defaultUnit, totalBalance: options?.unitBalance ?? 0 }
  unitRepo = new FakeUnitRepository(unit)

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

  const incrementProfileService = new IncrementBalanceProfileService(profileRepo)
  const incrementUnitService = new IncrementBalanceUnitService(unitRepo)
  const updateCashRegisterFinalAmountService = new UpdateCashRegisterFinalAmountService(cashRepo)

  const payUserCommissionService = new PayUserCommissionService(
    profileRepo,
    saleItemRepo,
    appointmentServiceRepo,
    incrementProfileService,
  )

  const payLoansService = new PayUserLoansService(loanRepo, unitRepo)

  const service = new PayBalanceTransactionService(
    barberRepo,
    cashRepo,
    saleItemRepo,
    payUserCommissionService,
    payLoansService,
    updateCashRegisterFinalAmountService,
  )

  return {
    service,
    profileRepo,
    unitRepo,
    transactionRepo,
    user,
    barberRepo,
    saleRepo,
    saleItemRepo,
    appointmentServiceRepo,
    appointmentRepo,
    unitRepo,
    loanRepo,
  }
}

import { prisma } from '../../../src/lib/prisma'

describe('Pay balance transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeAll(() => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn(prisma))
  })

  beforeEach(() => {
    ctx = setup({ unitBalance: 100 })
  })

  it('throws when paying more than user balance', async () => {
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
      ctx.service.execute(
        {
          userId: ctx.user.id,
          affectedUserId: other.id,
          description: '',
          amount: 20,
        },
        { unitId: ctx.unitRepo.unit.id } as any,
      ),
    ).rejects.toThrow('Insufficient balance for withdrawal')
  })

  it('pays user with positive balance', async () => {
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

    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: other.id,
        description: '',
        amount: 30,
      },
      { unitId: ctx.unitRepo.unit.id } as any,
    )

    const updatedProfile = ctx.profileRepo.profiles.find(p => p.id === profile.id)
    expect(updatedProfile?.totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('distributes amount across pending items', async () => {
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

    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: other.id,
        description: '',
        amount: 15,
      },
      { unitId: ctx.unitRepo.unit.id } as any,
    )

    const updatedProfile = ctx.profileRepo.profiles.find(p => p.id === profile.id)
    expect(updatedProfile?.totalBalance).toBe(5)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
    expect((sale2.items[0] as any).commissionPaid).toBe(false)
    expect((sale1.items[0] as any).commissionPaid).toBe(true)
    // transaction recorded for partial payment
  })

  it('pays specific sale items by id', async () => {
    const profile = makeProfile('p6', 'u6', 40)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u6', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-pay-items',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-pay-items'
    sale.items[0].serviceId = 'svc-pay-items'
    sale.items[0].price = 40
    sale.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: other.id,
        saleItemIds: ['it-pay-items'],
        description: '',
      },
      { unitId: ctx.unitRepo.unit.id } as any,
    )

    expect(ctx.transactionRepo.transactions).toHaveLength(1)
    expect((sale.items[0] as any).commissionPaid).toBe(true)
  })

  it('pays appointment services by id', async () => {
    const profile = makeProfile('p7', 'u7', 30)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u7', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const appointment = await ctx.appointmentRepo.create(
      {
        client: { connect: { id: other.id } },
        barber: { connect: { id: other.id } },
        unit: { connect: { id: ctx.unitRepo.unit.id } },
        date: new Date('2024-05-01T08:00:00'),
        status: 'SCHEDULED',
      },
      [
        {
          id: 'svc-appt',
          name: '',
          description: null,
          imageUrl: null,
          cost: 0,
          price: 30,
          categoryId: 'cat-1',
          defaultTime: null,
          commissionPercentage: null,
          unitId: ctx.unitRepo.unit.id,
        },
      ],
    )
    ctx.appointmentRepo.appointments[0].services[0].id = 'aps1'

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-appt',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-appt'
    sale.items[0].serviceId = 'svc-appt'
    sale.items[0].appointmentId = appointment.id
    sale.items[0].appointment = ctx.appointmentRepo.appointments[0]
    sale.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

    await ctx.service.execute(
      {
        userId: ctx.user.id,
        affectedUserId: other.id,
        appointmentServiceIds: ['aps1'],
        description: '',
      },
      { unitId: ctx.unitRepo.unit.id } as any,
    )

    expect(ctx.transactionRepo.transactions).toHaveLength(1)
    expect(
      ctx.appointmentRepo.appointments[0].services[0].commissionPaid,
    ).toBe(true)
  })

  it('throws when cash register is closed', async () => {
    const profile = makeProfile('p8', 'u8', 10)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u8', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    cashRepo.session = null

    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          affectedUserId: other.id,
          amount: 5,
        },
        { unitId: ctx.unitRepo.unit.id } as any,
      ),
    ).rejects.toThrow('Cash register closed')
  })

  it('throws when affected user is missing', async () => {
    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          affectedUserId: 'no-user',
          amount: 5,
        },
        { unitId: ctx.unitRepo.unit.id } as any,
      ),
    ).rejects.toThrow('Affected user not found')
  })

  it('throws when receivable amounts are inconsistent', async () => {
    const profile = makeProfile('p9', 'u9', 40)
    ctx.profileRepo.profiles.push(profile)
    const other = makeUser('u9', profile, ctx.unitRepo.unit)
    ctx.barberRepo.users.push(other)

    const sale = { ...makeSaleWithBarber(), id: 's-incons', paymentStatus: 'PAID' }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-incons'
    sale.items[0].serviceId = 'svc-incons'
    sale.items[0].price = 100
    sale.items[0].porcentagemBarbeiro = profile.commissionPercentage
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

    await expect(
      ctx.service.execute(
        {
          userId: ctx.user.id,
          affectedUserId: other.id,
          amount: 10,
        },
        { unitId: ctx.unitRepo.unit.id } as any,
      ),
    ).rejects.toThrow('Amounts receivable from the user are inconsistent')
  })
})
