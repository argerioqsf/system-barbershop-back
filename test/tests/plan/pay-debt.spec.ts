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

it('credits discounted amount to the unit', async () => {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()

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

  expect(unitRepo.unit.totalBalance).toBe(80)
  expect(debtRepo.debts[0].status).toBe('PAID')
})
