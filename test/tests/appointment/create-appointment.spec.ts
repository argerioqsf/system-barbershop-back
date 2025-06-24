import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAppointmentService } from '../../../src/services/appointment/create-appointment'
import {
  FakeAppointmentRepository,
  FakeBarberUsersRepository,
  FakeServiceRepository,
} from '../../helpers/fake-repositories'
import {
  barberUser,
  defaultClient,
  makeService,
} from '../../helpers/default-values'

describe('Create appointment service', () => {
  let repo: FakeAppointmentRepository
  let service: CreateAppointmentService
  let serviceRepo: FakeServiceRepository
  let barberUserRepo: FakeBarberUsersRepository

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    serviceRepo = new FakeServiceRepository()
    barberUserRepo = new FakeBarberUsersRepository()
    service = new CreateAppointmentService(repo, serviceRepo, barberUserRepo)
  })

  it('creates appointment', async () => {
    const serviceAppointment = makeService('service-11', 100)
    serviceRepo.services.push(serviceAppointment)
    barberUserRepo.users.push({ ...barberUser }, defaultClient)
    const res = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceId: 'service-11',
      unitId: 'unit-1',
      date: new Date('2024-01-01'),
      hour: '10:00',
    })
    expect(repo.appointments).toHaveLength(1)
    expect(res.appointment.clientId).toBe(defaultClient.id)
    expect(res.appointment.barberId).toBe(barberUser.id)
  })
})
