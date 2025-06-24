import { describe, it, expect, beforeEach } from 'vitest'
import { CreateAppointmentService } from '../../../src/services/appointment/create-appointment'
import {
  FakeAppointmentRepository,
  FakeBarberUsersRepository,
  FakeServiceRepository,
  FakeDayHourRepository,
} from '../../helpers/fake-repositories'
import {
  barberUser,
  defaultClient,
  makeService,
  makeBarberServiceRel,
  barberProfile,
} from '../../helpers/default-values'

describe('Create appointment service', () => {
  let repo: FakeAppointmentRepository
  let service: CreateAppointmentService
  let serviceRepo: FakeServiceRepository
  let barberUserRepo: FakeBarberUsersRepository
  let dayHourRepo: FakeDayHourRepository

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    serviceRepo = new FakeServiceRepository()
    barberUserRepo = new FakeBarberUsersRepository()
    dayHourRepo = new FakeDayHourRepository()
    service = new CreateAppointmentService(
      repo,
      serviceRepo,
      barberUserRepo,
      dayHourRepo,
    )
  })

  it('creates appointment', async () => {
    const serviceAppointment = makeService('service-11', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 40 })
    const dh = await dayHourRepo.create({
      weekDay: 1,
      startHour: new Date('1970-01-01T09:00:00Z'),
      endHour: new Date('1970-01-01T18:00:00Z'),
    })
    const barberWithRel = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-11')],
        workHours: [
          { id: 'wh-cre-1', profileId: barberProfile.id, dayHourId: dh.id },
        ],
      },
    }
    barberUserRepo.users.push(barberWithRel, defaultClient)
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
    expect(res.appointment.durationService).toBe(40)
  })

  it('uses barber time when set', async () => {
    const serviceAppointment = makeService('service-22', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const dh = await dayHourRepo.create({
      weekDay: 2,
      startHour: new Date('1970-01-01T09:00:00Z'),
      endHour: new Date('1970-01-01T18:00:00Z'),
    })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [
          makeBarberServiceRel(barberProfile.id, 'service-22', undefined, undefined, 50),
        ],
        workHours: [
          { id: 'wh-cre-2', profileId: barberProfile.id, dayHourId: dh.id },
        ],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    const res = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceId: 'service-22',
      unitId: 'unit-1',
      date: new Date('2024-01-02'),
      hour: '12:00',
    })
    expect(res.appointment.durationService).toBe(50)
  })

  it('fails when overlapping appointment', async () => {
    const dh1 = await dayHourRepo.create({
      weekDay: 3,
      startHour: new Date('1970-01-01T08:00:00Z'),
      endHour: new Date('1970-01-01T10:00:00Z'),
    })
    const serviceAppointment = makeService('service-33', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 60 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-33')],
        workHours: [{ id: 'wh1', profileId: barberProfile.id, dayHourId: dh1.id }],
        blockedHours: [],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceId: 'service-33',
      unitId: 'unit-1',
      date: new Date('2024-01-03'),
      hour: '08:00',
    })

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceId: 'service-33',
        unitId: 'unit-1',
        date: new Date('2024-01-03'),
        hour: '08:30',
      }),
    ).rejects.toThrow('Barber not available')
  })

  it('fails when time blocked', async () => {
    const dh1 = await dayHourRepo.create({
      weekDay: 4,
      startHour: new Date('1970-01-01T09:00:00Z'),
      endHour: new Date('1970-01-01T10:00:00Z'),
    })
    const serviceAppointment = makeService('service-44', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-44')],
        workHours: [{ id: 'wh2', profileId: barberProfile.id, dayHourId: dh1.id }],
        blockedHours: [
          { id: 'bh1', profileId: barberProfile.id, dayHourId: dh1.id },
        ],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceId: 'service-44',
        unitId: 'unit-1',
        date: new Date('2024-01-04'),
        hour: '09:00',
      }),
    ).rejects.toThrow('Barber not available')
  })
  it('fails when outside working hours', async () => {
    const dh = await dayHourRepo.create({
      weekDay: 5,
      startHour: new Date('1970-01-01T09:00:00Z'),
      endHour: new Date('1970-01-01T10:00:00Z'),
    })
    const serviceAppointment = makeService("service-55", 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, "service-55")],
        workHours: [{ id: "wh-out", profileId: barberProfile.id, dayHourId: dh.id }],
        blockedHours: [],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceId: "service-55",
        unitId: "unit-1",
        date: new Date("2024-01-05"),
        hour: "08:30",
      }),
    ).rejects.toThrow("Barber not available")
  })

})
