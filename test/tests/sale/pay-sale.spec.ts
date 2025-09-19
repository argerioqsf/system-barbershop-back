import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaySaleService } from '../../../src/services/sale/pay-sale'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeSaleRepository,
  FakeBarberUsersRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
  FakeCashRegisterRepository,
  FakeTransactionRepository,
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeAppointmentRepository,
  FakeAppointmentServiceRepository,
  FakeSaleItemRepository,
  FakeCouponRepository,
  FakeProductRepository,
  FakePlanProfileRepository,
  FakeTypeRecurrenceRepository,
} from '../../helpers/fake-repositories'
import {
  barberProfile,
  barberUser,
  defaultUser,
  defaultOrganization,
  defaultUnit,
  makeSaleWithBarber,
  makeService,
  makeCoupon,
  makeProduct,
  makePlan,
  defaultClient,
  defaultProfile,
  makeBarberServiceRel,
  makeBarberProductRel,
} from '../../helpers/default-values'
import { PaymentStatus } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let barberServiceRepo: FakeBarberServiceRelRepository
let barberProductRepo: FakeBarberProductRepository
let appointmentRepo: FakeAppointmentRepository
let appointmentServiceRepo: FakeAppointmentServiceRepository
let saleItemRepo: FakeSaleItemRepository
let couponRepo: FakeCouponRepository
let productRepo: FakeProductRepository
  let planProfileRepo: FakePlanProfileRepository
  let typeRecurrenceRepo: FakeTypeRecurrenceRepository

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

describe('Pay sale service', () => {
  let saleRepo: FakeSaleRepository
  let orgRepo: FakeOrganizationRepository
  let profileRepo: FakeProfilesRepository
  let unitRepo: FakeUnitRepository
  let service: PaySaleService

  beforeEach(() => {
    saleRepo = new FakeSaleRepository()
    barberRepo = new FakeBarberUsersRepository()
    barberServiceRepo = new FakeBarberServiceRelRepository()
    barberProductRepo = new FakeBarberProductRepository()
    appointmentRepo = new FakeAppointmentRepository()
    appointmentServiceRepo = new FakeAppointmentServiceRepository(
      appointmentRepo,
    )
    cashRepo = new FakeCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    orgRepo = new FakeOrganizationRepository({ ...defaultOrganization })
    profileRepo = new FakeProfilesRepository([
      { ...barberProfile, user: barberUser },
      { ...defaultProfile, user: { ...defaultClient, id: 'c1' } },
    ])
    const unit = { ...defaultUnit }
    unitRepo = new FakeUnitRepository(unit, [unit])
    saleItemRepo = new FakeSaleItemRepository(saleRepo)
    couponRepo = new FakeCouponRepository()
    productRepo = new FakeProductRepository()
    planProfileRepo = new FakePlanProfileRepository()
    typeRecurrenceRepo = new FakeTypeRecurrenceRepository([
      { id: 'rec-1', period: 1 },
      { id: 'rec1', period: 1 },
    ] as any)

    cashRepo.session = {
      id: 'session-1',
      openedById: 'cashier',
      unitId: defaultUnit.id,
      openedAt: new Date(),
      closedAt: null,
      initialAmount: 0,
      transactions: [],
      sales: [],
      finalAmount: null,
      user: defaultUser,
    }

    const sale = makeSaleWithBarber()
    const svc = makeService('svc-test', 100)
    sale.items[0].serviceId = svc.id
    sale.items[0].service = svc
    barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, svc.id, 'PERCENTAGE_OF_USER'),
    )
    saleRepo.sales.push(sale)

    barberRepo.users.push(
      {
        ...defaultUser,
        id: 'cashier',
        organizationId: defaultOrganization.id,
        unitId: defaultUnit.id,
        unit: { ...defaultUnit, organizationId: defaultOrganization.id },
      },
      barberUser,
    )

    service = new PaySaleService(
      saleRepo,
      barberRepo,
      barberServiceRepo,
      barberProductRepo,
      appointmentRepo,
      cashRepo,
      transactionRepo,
      orgRepo,
      profileRepo,
      unitRepo,
      appointmentServiceRepo,
      saleItemRepo,
      planProfileRepo,
      couponRepo,
      productRepo,
      typeRecurrenceRepo,
    )

    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn({} as any),
    )
  })

  it('marks sale as paid', async () => {
    const result = await service.execute({
      saleId: 'sale-1',
      userId: 'cashier',
    })

    expect(result.sale.paymentStatus).toBe(PaymentStatus.PAID)
  })

  it('creates plan profile when paying sale with plan', async () => {
    const plan = makePlan('pl1', 200)
    saleRepo.sales[0].items[0].planId = plan.id
    saleRepo.sales[0].items[0].plan = plan as any

    const res = await service.execute({ saleId: 'sale-1', userId: 'cashier' })

    expect(res.sale.paymentStatus).toBe(PaymentStatus.PAID)
    expect(planProfileRepo.items).toHaveLength(1)
    expect(planProfileRepo.items[0].planId).toBe(plan.id)
    expect(planProfileRepo.items[0].profileId).toBe('profile-user')
  })

  it('throws when plan already linked to client', async () => {
    const plan = makePlan('pl2', 150)
    saleRepo.sales[0].items[0].planId = plan.id
    saleRepo.sales[0].items[0].plan = plan as any
    planProfileRepo.items.push({
      id: 'pp1',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: 'old',
      dueDayDebt: 1,
      planId: plan.id,
      profileId: 'profile-user',
      debts: [],
    })

    await expect(
      service.execute({ saleId: 'sale-1', userId: 'cashier' }),
    ).rejects.toThrow('Client already linked to this plan')
  })

  it('updates coupon and product stock', async () => {
    const product = makeProduct('i1', 50, 5)
    const coupon = makeCoupon('c99', 'OFF', 5, 'VALUE')
    productRepo.products.push(product)
    couponRepo.coupons.push(coupon)
    barberProductRepo.items.push(
      makeBarberProductRel(barberProfile.id, product.id, 'PERCENTAGE_OF_USER'),
    )
    saleRepo.sales[0].items[0].productId = product.id
    saleRepo.sales[0].items[0].product = product as any
    saleRepo.sales[0].items[0].couponId = coupon.id
    saleRepo.sales[0].items[0].coupon = coupon as any

    await service.execute({ saleId: 'sale-1', userId: 'cashier' })

    expect(productRepo.products[0].quantity).toBe(4)
    expect(couponRepo.coupons[0].quantity).toBe(4)
  })
})
