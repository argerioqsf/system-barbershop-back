import { describe, it, expect, vi } from 'vitest'
import {
  buildItemData,
  calculateRealValueSaleItem,
} from '../../../src/services/sale/utils/item'
import {
  FakeSaleRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeCouponRepository,
  FakeAppointmentRepository,
  FakeAppointmentServiceRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  makeService,
  makeCoupon,
  barberUser,
  barberProfile,
  defaultUnit,
  makeSaleWithBarber,
} from '../../helpers/default-values'

function setup() {
  const saleRepo = new FakeSaleRepository()
  const serviceRepo = new FakeServiceRepository()
  const productRepo = new FakeProductRepository()
  const couponRepo = new FakeCouponRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  const appointmentServiceRepo = new FakeAppointmentServiceRepository(
    appointmentRepo,
  )
  const barberRepo = new FakeBarberUsersRepository()
  barberRepo.users.push({ ...barberUser, profile: barberProfile as any })

  const planRepo = {
    findByIdWithBenefits: vi.fn().mockResolvedValue(null),
  } as any

  const planProfileRepo = {
    findMany: vi.fn().mockResolvedValue([]),
  } as any

  const sale = makeSaleWithBarber()
  saleRepo.sales.push(sale)

  return {
    sale,
    saleRepo,
    serviceRepo,
    productRepo,
    couponRepo,
    appointmentRepo,
    appointmentServiceRepo,
    barberRepo,
    planRepo,
    planProfileRepo,
  }
}

describe('buildItemData util', () => {
  it('builds service item with coupon', async () => {
    const ctx = setup()
    const service = makeService('svc1', 100)
    const coupon = makeCoupon('c1', 'OFF10', 10, 'VALUE')
    ctx.serviceRepo.services.push(service)
    ctx.couponRepo.coupons.push(coupon)

    const item = await buildItemData({
      saleItem: {
        saleId: ctx.sale.id,
        serviceId: service.id,
        quantity: 1,
        couponId: coupon.id,
        barberId: barberUser.id,
      },
      saleRepository: ctx.saleRepo,
      serviceRepository: ctx.serviceRepo,
      productRepository: ctx.productRepo,
      appointmentRepository: ctx.appointmentRepo,
      couponRepository: ctx.couponRepo,
      barberUserRepository: ctx.barberRepo,
      planRepository: ctx.planRepo,
      planProfileRepository: ctx.planProfileRepo,
      userUnitId: defaultUnit.id,
    })

    expect(item.price).toBe(100)
    expect(calculateRealValueSaleItem(item.price, item.discounts)).toBe(90)
    expect(item.coupon?.id).toBe(coupon.id)
    expect(item.service?.id).toBe(service.id)
  })

  it('builds appointment item', async () => {
    const ctx = setup()
    const service = makeService('svc2', 50)
    ctx.serviceRepo.services.push(service)
    const appointment = await ctx.appointmentRepo.create(
      {
        client: { connect: { id: barberUser.id } },
        barber: { connect: { id: barberUser.id } },
        unit: { connect: { id: defaultUnit.id } },
        date: new Date('2024-01-01T10:00:00'),
        status: 'SCHEDULED',
      },
      [service],
    )
    const stored = ctx.appointmentRepo.appointments[0]

    const item = await buildItemData({
      saleItem: {
        saleId: ctx.sale.id,
        appointmentId: appointment.id,
        quantity: 1,
      },
      saleRepository: ctx.saleRepo,
      serviceRepository: ctx.serviceRepo,
      productRepository: ctx.productRepo,
      appointmentRepository: ctx.appointmentRepo,
      couponRepository: ctx.couponRepo,
      barberUserRepository: ctx.barberRepo,
      planRepository: ctx.planRepo,
      planProfileRepository: ctx.planProfileRepo,
      userUnitId: defaultUnit.id,
    })

    expect(item.price).toBe(50)
    expect(item.appointment?.id).toBe(appointment.id)
    expect(item.barber?.id).toBe(stored.barberId)
  })
})
