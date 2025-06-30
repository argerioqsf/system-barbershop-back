import { describe, it, expect } from 'vitest'
import { buildItemData } from '../../../src/services/sale/utils/item'
import {
  FakeServiceRepository,
  FakeProductRepository,
  FakeCouponRepository,
  FakeAppointmentRepository,
  FakeAppointmentServiceRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  makeService,
  makeProduct,
  makeCoupon,
  barberUser,
  barberProfile,
  defaultUnit,
} from '../../helpers/default-values'

function setup() {
  const serviceRepo = new FakeServiceRepository()
  const productRepo = new FakeProductRepository()
  const couponRepo = new FakeCouponRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  const appointmentServiceRepo = new FakeAppointmentServiceRepository(
    appointmentRepo,
  )
  const barberRepo = new FakeBarberUsersRepository()
  barberRepo.users.push({ ...barberUser, profile: barberProfile })
  return {
    serviceRepo,
    productRepo,
    couponRepo,
    appointmentRepo,
    appointmentServiceRepo,
    barberRepo,
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
      item: { serviceId: service.id, quantity: 1, couponCode: coupon.code, barberId: barberUser.id },
      serviceRepository: ctx.serviceRepo,
      productRepository: ctx.productRepo,
      appointmentRepository: ctx.appointmentRepo,
      couponRepository: ctx.couponRepo,
      barberUserRepository: ctx.barberRepo,
      userUnitId: defaultUnit.id,
    })

    expect(item.price).toBe(90)
    expect(item.discount).toBe(10)
    expect(item.data.service).toEqual({ connect: { id: service.id } })
    expect(item.data.coupon).toEqual({ connect: { id: coupon.id } })
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
      item: { appointmentId: appointment.id, quantity: 1 },
      serviceRepository: ctx.serviceRepo,
      productRepository: ctx.productRepo,
      appointmentRepository: ctx.appointmentRepo,
      couponRepository: ctx.couponRepo,
      barberUserRepository: ctx.barberRepo,
      userUnitId: defaultUnit.id,
    })

    expect(item.basePrice).toBe(50)
    expect(item.data.appointment).toEqual({ connect: { id: appointment.id } })
    expect(item.data.barber).toEqual({ connect: { id: stored.barberId } })
  })
})
