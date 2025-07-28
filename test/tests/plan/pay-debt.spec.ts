import { describe, it, expect, vi } from 'vitest'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import { PayDebtService } from '../../../src/services/plan/pay-debt'
import {
  FakeDebtRepository,
  FakePlanProfileRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import { defaultUnit, defaultUser, makeCashSession } from '../../helpers/default-values'
import { prisma } from '../../../src/lib/prisma'

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

it('increments unit balance when paying a debt', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as any),
  )

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 80,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 80 }] },
  } as any)
  const item = sale.items[0]

  const debt = {
    id: 'd1',
    value: 80,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp1',
    paymentDate: new Date('2024-07-28'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: item.id,
      dueDateDebt: 28,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit, id: 'unit-1', totalBalance: 0 })
  const user = { ...defaultUser, id: 'u1', unitId: 'unit-1' }
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('session-1', user.unitId), user }

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await service.execute({ debtId: debt.id, userId: 'u1' })

  expect(unitRepo.unit.totalBalance).toBe(80)
  expect(debtRepo.debts[0].status).toBe('PAID')
})

it('credits debt value to the unit even with discounts', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as any),
  )

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 80,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: {
      create: [
        {
          plan: { connect: { id: 'plan1' } },
          quantity: 1,
          price: 80,
          discounts: {
            create: [
              {
                amount: 20,
                type: 'VALUE',
                origin: 'COUPON_SALE_ITEM',
                order: 1,
              },
            ],
          },
        },
      ],
    },
  } as any)
  const item = sale.items[0]

  const debt = {
    id: 'd1',
    value: 100,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp1',
    paymentDate: new Date('2024-07-28'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: item.id,
      dueDateDebt: 28,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit, id: 'unit-1', totalBalance: 0 })
  const user = { ...defaultUser, id: 'u1', unitId: 'unit-1' }
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('session-1', user.unitId), user }

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await service.execute({ debtId: debt.id, userId: 'u1' })

  expect(unitRepo.unit.totalBalance).toBe(100)
  expect(debtRepo.debts[0].status).toBe('PAID')
})

it('updates plan profile status to PAID when overdue debt is settled', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 50,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 50 }] },
  } as any)
  const item = sale.items[0]

  const debt = {
    id: 'd2',
    value: 50,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp2',
    paymentDate: new Date('2024-06-05'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp2',
      planStartDate: new Date(),
      status: 'DEFAULTED',
      saleItemId: item.id,
      dueDateDebt: 5,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit, id: 'unit-1', totalBalance: 0 })
  const user = { ...defaultUser, id: 'u1', unitId: 'unit-1' }
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('session-1', user.unitId), user }

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await service.execute({ debtId: debt.id, userId: 'u1' })

  expect(profileRepo.items[0].status).toBe('PAID')
})

it('throws if debt is not found', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const debtRepo = new FakeDebtRepository()
  const profileRepo = new FakePlanProfileRepository()
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await expect(
    service.execute({ debtId: 'missing', userId: 'u1' }),
  ).rejects.toThrow('Debt not found')
})

it('throws if debt is already paid', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 20,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 20 }] },
  } as any)
  const item = sale.items[0]

  const debt = {
    id: 'dpaid',
    value: 20,
    status: 'PAID' as const,
    planId: 'plan1',
    planProfileId: 'pppaid',
    paymentDate: new Date('2024-06-01'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pppaid',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: item.id,
      dueDateDebt: 1,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await expect(
    service.execute({ debtId: debt.id, userId: 'u1' }),
  ).rejects.toThrow('Debt already paid')
})

it('throws if plan profile is missing', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const debt = {
    id: 'd3',
    value: 10,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp-missing',
    paymentDate: new Date('2024-06-01'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository()
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await expect(
    service.execute({ debtId: debt.id, userId: 'u1' }),
  ).rejects.toThrow('Plan profile not found')
})

it('throws if sale item is not found', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  await saleRepo.create({
    total: 10,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 10 }] },
  } as any)

  const debt = {
    id: 'd4',
    value: 10,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp4',
    paymentDate: new Date('2024-06-01'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp4',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: 'missing-item',
      dueDateDebt: 1,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await expect(
    service.execute({ debtId: debt.id, userId: 'u1' }),
  ).rejects.toThrow('Sale item not found')
})

it('keeps plan profile EXPIRED when other overdue debts exist', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 40,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 40 }] },
  } as any)
  const item = sale.items[0]

  const debt1 = {
    id: 'd5',
    value: 20,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp5',
    paymentDate: new Date('2023-01-01'),
    createdAt: new Date(),
  }
  const debt2 = {
    id: 'd6',
    value: 20,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp5',
    paymentDate: new Date('2023-02-01'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt1, debt2])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp5',
      planStartDate: new Date(),
      status: 'EXPIRED',
      saleItemId: item.id,
      dueDateDebt: 1,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt1, debt2],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })
  const user = { ...defaultUser, id: 'u1', unitId: 'unit-1' }
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('session-1', user.unitId), user }

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await service.execute({ debtId: debt1.id, userId: 'u1' })

  expect(profileRepo.items[0].status).toBe('EXPIRED')
})

it('does not change profile status when it is already PAID', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))

  const saleRepo = new FakeSaleRepository()
  const sale = await saleRepo.create({
    total: 30,
    method: 'CASH',
    paymentStatus: 'PAID',
    user: { connect: { id: 'u1' } },
    client: { connect: { id: 'c1' } },
    unit: { connect: { id: 'unit-1' } },
    items: { create: [{ plan: { connect: { id: 'plan1' } }, quantity: 1, price: 30 }] },
  } as any)
  const item = sale.items[0]

  const debt = {
    id: 'd7',
    value: 30,
    status: 'PENDING' as const,
    planId: 'plan1',
    planProfileId: 'pp7',
    paymentDate: new Date('2024-06-01'),
    createdAt: new Date(),
  }
  const debtRepo = new FakeDebtRepository([debt])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp7',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: item.id,
      dueDateDebt: 1,
      planId: 'plan1',
      profileId: 'p1',
      debts: [debt],
    },
  ])
  const itemRepo = new FakeSaleItemRepository(saleRepo)
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })
  const user = { ...defaultUser, id: 'u1', unitId: 'unit-1' }
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('session-1', user.unitId), user }

  const service = new PayDebtService(debtRepo, profileRepo, itemRepo, unitRepo)
  await service.execute({ debtId: debt.id, userId: 'u1' })

  expect(profileRepo.items[0].status).toBe('PAID')
})
