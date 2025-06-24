import { describe, it, expect, beforeEach } from 'vitest'
import { GetUserService } from '../../../src/services/barber-user/get-user'
import {
  InMemoryBarberUsersRepository,
  FakeAppointmentRepository,
  FakeDayHourRepository,
} from '../../helpers/fake-repositories'
import { makeUser } from '../../factories/make-user.factory'
import { makeProfile } from '../../factories/make-profile.factory'
import { makeService, makeAppointment } from "../../helpers/default-values"
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
} from '@prisma/client'

describe('Get user service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: GetUserService
  let appointmentRepo: FakeAppointmentRepository
  let dayHourRepo: FakeDayHourRepository

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    appointmentRepo = new FakeAppointmentRepository()
    dayHourRepo = new FakeDayHourRepository()
    service = new GetUserService(repo, appointmentRepo, dayHourRepo)
  })

  it('returns user by id', async () => {
    const user = makeUser()
    const profile: Profile & {
      role: Role
      permissions: Permission[]
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
    } = {
      ...makeProfile({ userId: user.id }),
      workHours: [],
      blockedHours: [],
    }
    repo.users.push({
      ...user,
      profile,
    })

    const res = await service.execute({ id: user.id })
    expect(res.user?.id).toBe(user.id)
    expect(res.user?.profile?.workHours).toBeDefined()
    expect(res.user?.profile?.blockedHours).toBeDefined()
    expect(res.user?.availableSlots).toEqual([])
  })

  it('computes available slots', async () => {
    const user = makeUser()
    const profile = { ...makeProfile({ userId: user.id }), workHours: [], blockedHours: [], barberServices: [] }
    const dh1 = await dayHourRepo.create({
      weekDay: 1,
      startHour: new Date('1970-01-01T09:00:00Z'),
      endHour: new Date('1970-01-01T10:00:00Z'),
    })
    const dh2 = await dayHourRepo.create({
      weekDay: 1,
      startHour: new Date('1970-01-01T10:00:00Z'),
      endHour: new Date('1970-01-01T11:00:00Z'),
    })
    profile.workHours = [
      { id: 'wh1', profileId: profile.id, dayHourId: dh1.id },
      { id: 'wh2', profileId: profile.id, dayHourId: dh2.id },
    ]
    repo.users.push({ ...user, profile })
    const srv = makeService('srv-1', 100)
    const app = makeAppointment('ap-1', srv, { date: new Date('2024-01-01'), hour: '09:00', durationService: 60 })
    appointmentRepo.appointments.push({ ...app, barberId: user.id, barber: user })
    const resSlots = await service.execute({ id: user.id })
    expect(resSlots.user?.availableSlots.map((s) => s.id)).toEqual([dh2.id])
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'no' })
    expect(res.user).toBeNull()
  })
})
