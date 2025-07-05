import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CreateAppointmentService } from '../../../src/services/appointment/create-appointment'
import {
  FakeAppointmentRepository,
  FakeBarberUsersRepository,
  FakeServiceRepository,
  FakeSaleRepository,
  FakeUnitRepository,
} from '../../helpers/fake-repositories'
import {
  barberUser,
  defaultClient,
  defaultUser,
  defaultUnit,
  makeService,
  makeBarberServiceRel,
  barberProfile,
} from '../../helpers/default-values'

describe('Create appointment service', () => {
  let repo: FakeAppointmentRepository
  let service: CreateAppointmentService
  let serviceRepo: FakeServiceRepository
  let barberUserRepo: FakeBarberUsersRepository
  let saleRepo: FakeSaleRepository
  let unitRepo: FakeUnitRepository

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2023-12-31T00:00:00Z'))
    repo = new FakeAppointmentRepository()
    serviceRepo = new FakeServiceRepository()
    barberUserRepo = new FakeBarberUsersRepository()
    saleRepo = new FakeSaleRepository()
    unitRepo = new FakeUnitRepository({ ...defaultUnit })
    service = new CreateAppointmentService(
      repo,
      serviceRepo,
      barberUserRepo,
      saleRepo,
      unitRepo,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates appointment', async () => {
    const serviceAppointment = makeService('service-11', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 40 })
    const workHour = {
      id: 'wh-cre-1',
      profileId: barberProfile.id,
      weekDay: 1,
      startHour: '09:00',
      endHour: '18:00',
    }
    const barberWithRel = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-11')],
        workHours: [workHour],
      },
    }
    barberUserRepo.users.push(barberWithRel, defaultClient)
    const res = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['service-11'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-01-01T10:00:00'),
    })
    expect(repo.appointments).toHaveLength(1)
    expect(res.appointment.clientId).toBe(defaultClient.id)
    expect(res.appointment.barberId).toBe(barberUser.id)
    expect(res.appointment.durationService).toBe(40)
  })

  it('uses barber time when set', async () => {
    const serviceAppointment = makeService('service-22', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const workHour2 = {
      id: 'wh-cre-2',
      profileId: barberProfile.id,
      weekDay: 2,
      startHour: '09:00',
      endHour: '18:00',
    }
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [
          makeBarberServiceRel(
            barberProfile.id,
            'service-22',
            undefined,
            undefined,
            50,
          ),
        ],
        workHours: [workHour2],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    const res = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['service-22'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-01-02T12:00:00'),
    })
    expect(res.appointment.durationService).toBe(50)
  })

  it('fails when overlapping appointment', async () => {
    const workHour3 = {
      id: 'wh1',
      profileId: barberProfile.id,
      weekDay: 3,
      startHour: '08:00',
      endHour: '10:00',
    }
    const serviceAppointment = makeService('service-33', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 60 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-33')],
        workHours: [workHour3],
        blockedHours: [],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['service-33'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-01-03T08:00:00'),
    })

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['service-33'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-03T08:30:00'),
      }),
    ).rejects.toThrow('Barber not available')
  })

  it('fails when time blocked', async () => {
    const workHour4 = {
      id: 'wh2',
      profileId: barberProfile.id,
      weekDay: 4,
      startHour: '09:00',
      endHour: '10:00',
    }
    const serviceAppointment = makeService('service-44', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-44')],
        workHours: [workHour4],
        blockedHours: [
          {
            id: 'bh1',
            profileId: barberProfile.id,
            startHour: new Date('2024-01-04T09:00:00'),
            endHour: new Date('2024-01-04T10:00:00'),
          },
        ],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['service-44'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-04T09:00:00'),
      }),
    ).rejects.toThrow('Barber not available')
  })

  it('allows scheduling around blocked interval', async () => {
    const workHourSplit = {
      id: 'wh-split',
      profileId: barberProfile.id,
      weekDay: 6,
      startHour: '08:00',
      endHour: '12:00',
    }
    const svc = makeService('svc-split', 100)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'svc-split')],
        workHours: [workHourSplit],
        blockedHours: [
          {
            id: 'bh-split',
            profileId: barberProfile.id,
            startHour: new Date('2024-01-06T09:00:00'),
            endHour: new Date('2024-01-06T09:30:00'),
          },
        ],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)

    const early = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['svc-split'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-01-06T08:30:00'),
    })
    expect(early.appointment).toBeDefined()

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['svc-split'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-06T09:15:00'),
      }),
    ).rejects.toThrow('Barber not available')
  })
  it('fails when outside working hours', async () => {
    const workHourOut = {
      id: 'wh-out',
      profileId: barberProfile.id,
      weekDay: 5,
      startHour: '09:00',
      endHour: '10:00',
    }
    const serviceAppointment = makeService('service-55', 100)
    serviceRepo.services.push({ ...serviceAppointment, defaultTime: 30 })
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'service-55')],
        workHours: [workHourOut],
        blockedHours: [],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['service-55'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-05T08:30:00'),
      }),
    ).rejects.toThrow('Barber not available')
  })

  it('throws when service not found', async () => {
    barberUserRepo.users.push(barberUser, defaultClient)
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['missing'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-01T09:00:00'),
      }),
    ).rejects.toThrow('Service not found')
  })

  it('throws when barber not found', async () => {
    const svc = makeService('svc-err', 100)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    barberUserRepo.users.push(defaultClient)
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: 'no',
        serviceIds: ['svc-err'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-01T09:00:00'),
      }),
    ).rejects.toThrow('Barber not found')
  })

  it('throws when client not found', async () => {
    const svc = makeService('svc-err2', 100)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    barberUserRepo.users.push(barberUser)
    await expect(
      service.execute({
        clientId: 'no',
        barberId: barberUser.id,
        serviceIds: ['svc-err2'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-01T09:00:00'),
      }),
    ).rejects.toThrow('User not found')
  })

  it('throws when barber lacks service', async () => {
    const svc = makeService('svc-none', 100)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    barberUserRepo.users.push(
      { ...barberUser, profile: { ...barberProfile, barberServices: [] } },
      defaultClient,
    )
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['svc-none'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-01T09:00:00'),
      }),
    ).rejects.toThrow('The barber does not have this item linked')
  })

  it('applies discount when value provided', async () => {
    const svc = makeService('svc-disc', 100)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    const workHourDisc = {
      id: 'wh-disc',
      profileId: barberProfile.id,
      weekDay: 1,
      startHour: '09:00',
      endHour: '10:00',
    }
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'svc-disc')],
        workHours: [workHourDisc],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    const res = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['svc-disc'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-01-01T09:00:00'),
    })
    expect(res.appointment).toBeTruthy()
  })

  it('creates sale with pending status', async () => {
    const svc = makeService('svc-sale', 70)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    const wh = {
      id: 'wh-sale',
      profileId: barberProfile.id,
      weekDay: 4,
      startHour: '09:00',
      endHour: '18:00',
    }
    const barberWithService = {
      ...barberUser,
      profile: {
        ...barberProfile,
        barberServices: [makeBarberServiceRel(barberProfile.id, 'svc-sale')],
        workHours: [wh],
      },
    }
    barberUserRepo.users.push(barberWithService, defaultClient)
    unitRepo.unit.appointmentFutureLimitDays = 0

    const { appointment } = await service.execute({
      clientId: defaultClient.id,
      barberId: barberUser.id,
      serviceIds: ['svc-sale'],
      unitId: 'unit-1',
      userId: defaultUser.id,
      date: new Date('2024-02-01T10:00:00'),
    })

    expect(saleRepo.sales).toHaveLength(1)
    expect(saleRepo.sales[0].paymentStatus).toBe('PENDING')
    expect(saleRepo.sales[0].items[0].appointmentId).toBe(appointment.id)
  })

  it('fails when scheduling in the past', async () => {
    const svc = makeService('svc-past', 60)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    const wh = {
      id: 'wh-past',
      profileId: barberProfile.id,
      weekDay: 1,
      startHour: '09:00',
      endHour: '18:00',
    }
    barberUserRepo.users.push(
      {
        ...barberUser,
        profile: {
          ...barberProfile,
          workHours: [wh],
          barberServices: [makeBarberServiceRel(barberProfile.id, 'svc-past')],
        },
      },
      defaultClient,
    )

    vi.setSystemTime(new Date('2024-02-01T00:00:00Z'))

    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['svc-past'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-01T10:00:00'),
      }),
    ).rejects.toThrow('Cannot schedule appointment in the past')
  })

  it('fails when scheduling beyond unit limit', async () => {
    const svc = makeService('svc-limit', 60)
    serviceRepo.services.push({ ...svc, defaultTime: 30 })
    const wh = {
      id: 'wh-limit',
      profileId: barberProfile.id,
      weekDay: 1,
      startHour: '09:00',
      endHour: '18:00',
    }
    unitRepo.unit.appointmentFutureLimitDays = 3
    barberUserRepo.users.push(
      {
        ...barberUser,
        profile: {
          ...barberProfile,
          workHours: [wh],
          barberServices: [makeBarberServiceRel(barberProfile.id, 'svc-limit')],
        },
      },
      defaultClient,
    )
    await expect(
      service.execute({
        clientId: defaultClient.id,
        barberId: barberUser.id,
        serviceIds: ['svc-limit'],
        unitId: 'unit-1',
        userId: defaultUser.id,
        date: new Date('2024-01-05T10:00:00'),
      }),
    ).rejects.toThrow('Cannot schedule appointment so far in the future')
  })
})
