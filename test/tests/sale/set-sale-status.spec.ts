import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SetSaleStatusService } from '../../../src/services/sale/set-sale-status'
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
} from '../../helpers/fake-repositories'
import {
  barberProfile,
  barberUser,
  defaultUser,
  defaultOrganization,
  defaultUnit,
  makeSaleWithBarber,
  makeSale,
  makeBarberServiceRel,
  makeProduct,
  makeBarberProductRel,
  makeServiceWithCommission,
  makeAppointment,
} from '../../helpers/default-values'
import { PaymentStatus } from '@prisma/client'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let barberServiceRepo: FakeBarberServiceRelRepository
let barberProductRepo: FakeBarberProductRepository
let appointmentRepo: FakeAppointmentRepository

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

describe('Set sale status service', () => {
  let saleRepo: FakeSaleRepository
  let orgRepo: FakeOrganizationRepository
  let profileRepo: FakeProfilesRepository
  let unitRepo: FakeUnitRepository
  let service: SetSaleStatusService

  beforeEach(() => {
    saleRepo = new FakeSaleRepository()
    barberRepo = new FakeBarberUsersRepository()
    barberServiceRepo = new FakeBarberServiceRelRepository()
    barberProductRepo = new FakeBarberProductRepository()
    appointmentRepo = new FakeAppointmentRepository()
    cashRepo = new FakeCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    orgRepo = new FakeOrganizationRepository({ ...defaultOrganization })
    profileRepo = new FakeProfilesRepository([
      { ...barberProfile, user: barberUser },
    ])
    const unit = { ...defaultUnit }
    unitRepo = new FakeUnitRepository(unit, [unit])

    const sale = makeSaleWithBarber()

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

    service = new SetSaleStatusService(
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
    )
  })

  it('returns sale when status unchanged', async () => {
    const res = await service.execute({
      saleId: 'sale-1',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PENDING,
    })
    expect(res.sale.paymentStatus).toBe(PaymentStatus.PENDING)
    expect(transactionRepo.transactions).toHaveLength(0)
  })

  it('marks sale as paid and updates balances', async () => {
    const res = await service.execute({
      saleId: 'sale-1',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })
    expect(res.sale.paymentStatus).toBe(PaymentStatus.PAID)
    expect(transactionRepo.transactions).toHaveLength(2)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(50)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(50)
  })

  it('uses relation percentage when paying a pending sale', async () => {
    const serviceDef = makeServiceWithCommission('svc-1', 100, 30)
    const sale = makeSale('sale-2')
    sale.items.push({
      id: 'it2',
      saleId: sale.id,
      serviceId: serviceDef.id,
      productId: null,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 100,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: serviceDef,
      product: null,
      barber: { ...barberUser, profile: barberProfile },
      coupon: null,
      appointmentId: null,
      appointment: null,
    })
    saleRepo.sales.push(sale)
    barberServiceRepo.items.push(
      makeBarberServiceRel(
        barberProfile.id,
        serviceDef.id,
        'PERCENTAGE_OF_ITEM',
      ),
    )

    const res = await service.execute({
      saleId: 'sale-2',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(30)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(30)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(70)
  })

  it('applies product relation when paying pending sale', async () => {
    const product = makeProduct('prod-1', 50)
    const sale = makeSale('sale-3')
    sale.items.push({
      id: 'ip1',
      saleId: sale.id,
      serviceId: null,
      productId: product.id,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 50,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: null,
      product,
      barber: { ...barberUser, profile: barberProfile },
      coupon: null,
      appointmentId: null,
      appointment: null,
    })
    saleRepo.sales.push(sale)
    barberProductRepo.items.push(
      makeBarberProductRel(
        barberProfile.id,
        product.id,
        'PERCENTAGE_OF_USER_ITEM',
        60,
      ),
    )

    const res = await service.execute({
      saleId: 'sale-3',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(60)
  })

  it('handles appointment relation when paying pending sale', async () => {
    const serviceDef = makeServiceWithCommission('svc-appt', 80, 50)
    const appointment = makeAppointment('appt-1', serviceDef, {
      discount: 20,
      value: 80,
    })
    appointmentRepo.appointments.push(appointment)
    const sale = makeSale('sale-4')
    sale.items.push({
      id: 'ia1',
      saleId: sale.id,
      serviceId: serviceDef.id,
      productId: null,
      appointmentId: appointment.id,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 80,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: serviceDef,
      product: null,
      barber: { ...barberUser, profile: barberProfile },
      appointment,
      coupon: null,
    })
    saleRepo.sales.push(sale)
    barberServiceRepo.items.push(
      makeBarberServiceRel(
        barberProfile.id,
        serviceDef.id,
        'PERCENTAGE_OF_ITEM',
        50,
      ),
    )

    const res = await service.execute({
      saleId: 'sale-4',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(50)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(40)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(40)
  })

  it('applies USER_ITEM relation for appointment item', async () => {
    const serviceDef = makeServiceWithCommission('svc-appt2', 90, 30)
    const appointment = makeAppointment('appt-2', serviceDef, {
      value: 90,
    })
    appointmentRepo.appointments.push(appointment)
    const sale = makeSale('sale-5')
    sale.items.push({
      id: 'ia2',
      saleId: sale.id,
      serviceId: serviceDef.id,
      productId: null,
      appointmentId: appointment.id,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 90,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: serviceDef,
      product: null,
      barber: { ...barberUser, profile: barberProfile },
      appointment,
      coupon: null,
    })
    saleRepo.sales.push(sale)
    barberServiceRepo.items.push(
      makeBarberServiceRel(
        barberProfile.id,
        serviceDef.id,
        'PERCENTAGE_OF_USER_ITEM',
        40,
      ),
    )

    const res = await service.execute({
      saleId: 'sale-5',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(40)
  })

  it('concludes appointment when paying sale', async () => {
    const serviceDef = makeServiceWithCommission('svc-appt3', 70, 20)
    const appointment = makeAppointment('appt-3', serviceDef)
    appointmentRepo.appointments.push(appointment)
    const sale = makeSale('sale-6')
    sale.items.push({
      id: 'ia3',
      saleId: sale.id,
      serviceId: serviceDef.id,
      productId: null,
      appointmentId: appointment.id,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 70,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: serviceDef,
      product: null,
      barber: { ...barberUser, profile: barberProfile },
      appointment,
      coupon: null,
    })
    saleRepo.sales.push(sale)
    barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, serviceDef.id, 'PERCENTAGE_OF_ITEM')
    )

    await service.execute({
      saleId: 'sale-6',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(
      appointmentRepo.appointments.find((a) => a.id === appointment.id)?.status,
    ).toBe('CONCLUDED')
  })
})
