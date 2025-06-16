import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAppointmentService } from '../../../src/services/appointment/create-appointment'
import { InMemoryAppointmentRepository } from '../../helpers/fake-repositories'

describe('Create appointment service', () => {
  let repo: InMemoryAppointmentRepository
  let service: CreateAppointmentService

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository()
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
    })
    expect(repo.appointments).toHaveLength(1)
    expect(res.appointment.clientId).toBe('c1')
  })
})
