import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateSaleService } from '../../../src/services/sale/update-sale'
import {
  FakeSaleRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeCouponRepository,
  FakeBarberUsersRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
  FakeCashRegisterRepository,
  FakeTransactionRepository,
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeAppointmentServiceRepository,
  FakeSaleItemRepository,
} from '../../helpers/fake-repositories'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  makeSale,
  makeService,
  makeSaleWithBarber,
  makeAppointment,
  makeCoupon,
  makeBarberServiceRel,
  barberUser,
  barberProfile,
  defaultOrganization,
  defaultUser,
  defaultUnit,
} from '../../helpers/default-values'
import { PaymentMethod, DiscountType } from '@prisma/client'


describe('Update sale service', () => {
  let repo: FakeSaleRepository
  let serviceRepo: FakeServiceRepository
  let productRepo: FakeProductRepository
  let appointmentRepo: FakeAppointmentRepository
  let couponRepo: FakeCouponRepository
  let barberRepo: FakeBarberUsersRepository
  let barberServiceRepo: FakeBarberServiceRelRepository
  let barberProductRepo: FakeBarberProductRepository
  let cashRepo: FakeCashRegisterRepository
  let transactionRepo: FakeTransactionRepository
  let organizationRepo: FakeOrganizationRepository
  let profilesRepo: FakeProfilesRepository
  let unitRepo: FakeUnitRepository
  let appointmentServiceRepo: FakeAppointmentServiceRepository
let saleItemRepo: FakeSaleItemRepository
let service: UpdateSaleService


  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(makeSale('sale-up-1'))
    repo.sales[0].userId = 'cashier'
    ;(repo.sales[0] as any).user.id = 'cashier'
    serviceRepo = new FakeServiceRepository()
    productRepo = new FakeProductRepository()
    appointmentRepo = new FakeAppointmentRepository()
    couponRepo = new FakeCouponRepository()
    barberRepo = new FakeBarberUsersRepository()
    barberServiceRepo = new FakeBarberServiceRelRepository()
    barberProductRepo = new FakeBarberProductRepository()
    cashRepo = new FakeCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    organizationRepo = new FakeOrganizationRepository({ ...defaultOrganization })
    profilesRepo = new FakeProfilesRepository([{ ...barberProfile, user: barberUser }])
    unitRepo = new FakeUnitRepository({ ...defaultUnit })
    appointmentServiceRepo = new FakeAppointmentServiceRepository(appointmentRepo)
    saleItemRepo = new FakeSaleItemRepository(repo)
    vi.doMock(
      '../../../src/services/@factories/transaction/make-create-transaction',
      () => ({
        makeCreateTransaction: () =>
          new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
      }),
    )
    barberRepo.users.push(
      { ...defaultUser, id: 'cashier', organizationId: defaultOrganization.id, unitId: defaultUnit.id, unit: { ...defaultUnit, organizationId: defaultOrganization.id } },
      barberUser,
    )
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
    service = new UpdateSaleService(
      repo,
      serviceRepo,
      productRepo,
      appointmentRepo,
      couponRepo,
      barberRepo,
      barberServiceRepo,
      barberProductRepo,
      cashRepo,
      transactionRepo,
      organizationRepo,
      profilesRepo,
      unitRepo,
      appointmentServiceRepo,
      saleItemRepo,
    )
  })

  it('updates sale data', async () => {
    const res = await service.execute({
      id: 'sale-up-1',
      method: PaymentMethod.PIX,
    })
    expect(res.sale.method).toBe(PaymentMethod.PIX)
    expect(repo.sales[0].method).toBe(PaymentMethod.PIX)
  })

  it('updates observation and payment status', async () => {
    const res = await service.execute({
      id: 'sale-up-1',
      observation: 'note',
      paymentStatus: 'PAID',
    })
    expect(res.sale.observation).toBe('note')
    expect(res.sale.paymentStatus).toBe('PAID')
    const saved = repo.sales[0]
    expect(saved.observation).toBe('note')
    expect(saved.paymentStatus).toBe('PAID')
  })

  it('adds new sale items', async () => {
    const svc = makeService('svc-1', 50)
    serviceRepo.services.push(svc)

    const res = await service.execute({
      id: 'sale-up-1',
      items: [{ serviceId: svc.id, quantity: 2 }],
    })

    expect(res.sale.items).toHaveLength(1)
    expect(res.sale.total).toBe(200)
    expect(repo.sales[0].items).toHaveLength(1)
  })

  it('adds item with coupon', async () => {
    const svc = makeService('svc-c', 100)
    const coupon = makeCoupon('c1', 'OFF10', 10, DiscountType.VALUE)
    serviceRepo.services.push(svc)
    couponRepo.coupons.push(coupon)

    const res = await service.execute({
      id: 'sale-up-1',
      items: [{ serviceId: svc.id, quantity: 1, couponCode: coupon.code }],
    })

    expect(res.sale.total).toBe(190)
    expect(res.sale.items[0].discount).toBe(10)
    expect(couponRepo.coupons[0].quantity).toBe(4)
  })

  it('applies general coupon', async () => {
    const svc = makeService('svc-g', 100)
    const coupon = makeCoupon('c2', 'G10', 10, DiscountType.VALUE)
    serviceRepo.services.push(svc)
    couponRepo.coupons.push(coupon)

    const res = await service.execute({
      id: 'sale-up-1',
      items: [{ serviceId: svc.id, quantity: 1 }],
      couponCode: coupon.code,
    })

    expect(res.sale.total).toBe(190)
    expect(res.sale.items[0].discount).toBe(10)
    expect(couponRepo.coupons[0].quantity).toBe(4)
  })

  it('adds appointment sale item', async () => {
    const svc = makeService('svc-apt', 30)
    serviceRepo.services.push(svc)
    const appointment = {
      ...makeAppointment('app-1', svc),
      saleItem: null,
    }
    appointmentRepo.appointments.push(appointment)

    const res = await service.execute({
      id: 'sale-up-1',
      items: [{ appointmentId: appointment.id, quantity: 1 }],
    })

    expect(res.sale.items).toHaveLength(1)
    expect(res.sale.items[0].appointmentId).toBe(appointment.id)
    expect(res.sale.total).toBe(130)
    expect(
      appointmentRepo.appointments.find((a) => a.id === appointment.id)?.saleItem,
    ).not.toBeNull()
    expect(
      appointmentRepo.appointments.find((a) => a.id === appointment.id)?.status,
    ).toBe('SCHEDULED')
  })

  it('concludes appointment when sale is paid', async () => {
    const svc = makeService('svc-apt2', 40)
    serviceRepo.services.push(svc)
    const appointment = {
      ...makeAppointment('app-2', svc),
      saleItem: null,
    }
    appointmentRepo.appointments.push(appointment)

    const res = await service.execute({
      id: 'sale-up-1',
      paymentStatus: 'PAID',
      items: [{ appointmentId: appointment.id, quantity: 1 }],
    })

    expect(res.sale.items[0].appointmentId).toBe(appointment.id)
    expect(
      appointmentRepo.appointments.find((a) => a.id === appointment.id)?.status,
    ).toBe('CONCLUDED')
  })

  it('marks sale as paid and updates balances', async () => {
    const sale = makeSaleWithBarber()
    const svc = makeService('svc-paid', 100)
    sale.items[0].serviceId = svc.id
    sale.items[0].service = svc
    barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, svc.id, 'PERCENTAGE_OF_USER'),
    )
    serviceRepo.services.push(svc)
    repo.sales = [sale]

    const res = await service.execute({ id: 'sale-1', paymentStatus: 'PAID' })

    expect(res.sale.paymentStatus).toBe('PAID')
    expect(transactionRepo.transactions).toHaveLength(2)
    expect(profilesRepo.profiles[0].totalBalance).toBeCloseTo(50)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(50)
  })

  it('removes sale items', async () => {
    const withItem = makeSaleWithBarber()
    repo.sales = [withItem]
    service = new UpdateSaleService(
      repo,
      serviceRepo,
      productRepo,
      appointmentRepo,
      couponRepo,
      barberRepo,
      barberServiceRepo,
      barberProductRepo,
      cashRepo,
      transactionRepo,
      organizationRepo,
      profilesRepo,
      unitRepo,
      appointmentServiceRepo,
      saleItemRepo,
    )

    const res = await service.execute({
      id: 'sale-1',
      removeItemIds: ['i1'],
    })

    expect(res.sale.items).toHaveLength(0)
    expect(res.sale.total).toBe(0)
  })

  it('throws when sale already paid', async () => {
    repo.sales[0].paymentStatus = 'PAID'
    await expect(
      service.execute({ id: 'sale-up-1', observation: 'x' }),
    ).rejects.toThrow('Cannot edit a paid sale')
  })
})
