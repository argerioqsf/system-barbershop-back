import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateAppointmentService } from '../../../src/services/appointment/update-appointment'
import { FakeAppointmentRepository } from '../../helpers/fake-repositories'
import { makeAppointment, makeService } from '../../helpers/default-values'

const serviceDef = makeService('svc-up-1')
const appointment = makeAppointment('appt-up-1', serviceDef)

describe('Update appointment service', () => {
  let repo: FakeAppointmentRepository
  let service: UpdateAppointmentService

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    repo.appointments.push(appointment)
    service = new UpdateAppointmentService(repo)
  })

  it('updates appointment data', async () => {
    const res = await service.execute({
      id: 'appt-up-1',
      data: { status: 'CANCELED' },
    })
    expect(res.appointment.status).toBe('CANCELED')
    expect(repo.appointments[0].status).toBe('CANCELED')
  })

  it('updates observation', async () => {
    const res = await service.execute({
      id: 'appt-up-1',
      data: { observation: 'new' },
    })
    expect(res.appointment.observation).toBe('new')
    const saved = repo.appointments[0]
    expect(saved.observation).toBe('new')
  })
})
