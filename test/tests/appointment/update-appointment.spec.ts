import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateAppointmentUseCase } from '../../../src/modules/appointment/application/use-cases/update-appointment'
import { AppointmentTelemetryEvent } from '../../../src/modules/appointment/application/contracts/appointment-telemetry'
import { FakeAppointmentRepository } from '../../helpers/fake-repositories'
import { makeAppointment, makeService } from '../../helpers/default-values'

const serviceDef = makeService('svc-up-1')
const appointment = makeAppointment('appt-up-1', serviceDef)

class FakeAppointmentTelemetry {
  public events: AppointmentTelemetryEvent[] = []

  async record(event: AppointmentTelemetryEvent): Promise<void> {
    this.events.push(event)
  }
}

describe('Update appointment use case', () => {
  let repo: FakeAppointmentRepository
  let useCase: UpdateAppointmentUseCase
  let telemetry: FakeAppointmentTelemetry

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    repo.appointments.push(appointment)
    telemetry = new FakeAppointmentTelemetry()
    useCase = new UpdateAppointmentUseCase(repo, telemetry)
  })

  it('updates appointment data', async () => {
    const res = await useCase.execute({
      id: 'appt-up-1',
      data: { status: 'CANCELED' },
      actorId: 'user-1',
    })
    expect(res.appointment.status).toBe('CANCELED')
    expect(repo.appointments[0].status).toBe('CANCELED')
    expect(telemetry.events[0]?.operation).toBe('appointment.updated')
    expect(telemetry.events[0]?.actorId).toBe('user-1')
  })

  it('updates observation', async () => {
    const res = await useCase.execute({
      id: 'appt-up-1',
      data: { observation: 'new' },
      actorId: 'user-1',
    })
    expect(res.appointment.observation).toBe('new')
    const saved = repo.appointments[0]
    expect(saved.observation).toBe('new')
  })
})
