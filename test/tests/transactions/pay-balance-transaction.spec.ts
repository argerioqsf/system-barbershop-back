import { describe, it, expect, beforeEach, vi } from 'vitest'
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
} from '../../helpers/fake-repositories'
import {
  defaultUser,
  defaultProfile,
  defaultUnit,
  makeProfile,
  makeUser,
  makeSaleWithBarber,
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
  const saleRepo = new FakeSaleRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  const saleItemRepo = new FakeSaleItemRepository(saleRepo)
  const appointmentServiceRepo = new FakeAppointmentServiceRepository(
    appointmentRepo,
  )
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
    saleRepo,
    saleItemRepo,
    appointmentServiceRepo,
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
  }
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

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-over',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-over'
    sale.items[0].serviceId = 'svc-over'
    sale.items[0].price = 40
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

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

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-pay',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = other.id
    sale.items[0].id = 'it-pay'
    sale.items[0].serviceId = 'svc-pay'
    sale.items[0].price = 60
    ;(sale.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale as any)

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
    sale1.items[0].price = 20
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
    sale2.items[0].price = 20
    ;(sale2.items[0] as any).commissionPaid = false
    ctx.saleRepo.sales.push(sale1 as any, sale2 as any)

    await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      description: '',
      amount: 15,
    })

    expect(profile.totalBalance).toBe(5)
    expect(ctx.transactionRepo.transactions).toHaveLength(2)
    expect((sale2.items[0] as any).commissionPaid).toBe(false)
    expect((sale1.items[0] as any).commissionPaid).toBe(true)
    // transaction recorded for partial payment
  })
})
