import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAppointmentService } from '../../../src/services/appointment/create-appointment'
import { FakeAppointmentRepository } from '../../helpers/fake-repositories'

describe('Create appointment service', () => {
  let repo: FakeAppointmentRepository
  let service: CreateAppointmentService

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    service = new CreateAppointmentService(repo)
  })

  it('creates appointment', async () => {
    const res = await service.execute({
      clientId: 'c1',
      barberId: 'b1',
      serviceId: 's1',
      unitId: 'unit-1',
      date: new Date('2024-01-01'),
      hour: '10:00',
      discount: 5,
    })
    expect(repo.appointments).toHaveLength(1)
    expect(res.appointment.clientId).toBe('c1')
    expect(res.appointment.discount).toBe(5)
  })
})
