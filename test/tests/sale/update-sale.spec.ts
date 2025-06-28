import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateSaleService } from '../../../src/services/sale/update-sale'
import {
  FakeSaleRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
} from '../../helpers/fake-repositories'
import {
  makeSale,
  makeService,
  makeSaleWithBarber,
  makeAppointment,
} from '../../helpers/default-values'
import { PaymentMethod } from '@prisma/client'


describe('Update sale service', () => {
  let repo: FakeSaleRepository
  let serviceRepo: FakeServiceRepository
  let productRepo: FakeProductRepository
  let appointmentRepo: FakeAppointmentRepository
  let service: UpdateSaleService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(makeSale('sale-up-1'))
    serviceRepo = new FakeServiceRepository()
    productRepo = new FakeProductRepository()
    appointmentRepo = new FakeAppointmentRepository()
    service = new UpdateSaleService(
      repo,
      serviceRepo,
      productRepo,
      appointmentRepo,
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

  it('removes sale items', async () => {
    const withItem = makeSaleWithBarber()
    repo.sales = [withItem]
    service = new UpdateSaleService(repo, serviceRepo, productRepo, appointmentRepo)

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
