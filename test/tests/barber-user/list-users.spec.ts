import { describe, it, expect, beforeEach } from 'vitest'
import { ListUsersService } from '../../../src/services/barber-user/list-users'
import {
  InMemoryBarberUsersRepository,
  FakeAppointmentRepository,
  FakeDayHourRepository,
} from '../../helpers/fake-repositories'
import { listUser1 as u1, listUser2 as u2 } from '../../helpers/default-values'
import { makeService, makeAppointment } from '../../helpers/default-values'

describe('List users service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: ListUsersService
  let appointmentRepo: FakeAppointmentRepository
  let dayHourRepo: FakeDayHourRepository

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository([u1, u2])
    appointmentRepo = new FakeAppointmentRepository()
    dayHourRepo = new FakeDayHourRepository()
    service = new ListUsersService(repo, appointmentRepo, dayHourRepo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.users).toHaveLength(2)
    expect(res.users[0].profile?.workHours).toBeDefined()
    expect(res.users[0].profile?.blockedHours).toBeDefined()
    expect(Array.isArray(res.users[0].availableSlots)).toBe(true)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    })
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u2')
  })

  it('computes available slots for user', async () => {
    const dh1 = await dayHourRepo.create({
      weekDay: 1,
      startHour: '09:00',
      endHour: '10:00',
    })
    const dh2 = await dayHourRepo.create({
      weekDay: 1,
      startHour: '10:00',
      endHour: '11:00',
    })
    const profile = { ...u1.profile, workHours: [
      { id: 'wh1', profileId: u1.profile.id, dayHourId: dh1.id },
      { id: 'wh2', profileId: u1.profile.id, dayHourId: dh2.id },
    ], blockedHours: [] }
    repo.users = [{ ...u1, profile }, u2]
    const srv = makeService('srv-1', 100)
    const app = makeAppointment('ap-1', srv, { date: new Date('2024-01-01'), hour: '09:00', durationService: 60 })
    appointmentRepo.appointments.push({ ...app, barberId: u1.id, barber: u1 })
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    const u = res.users.find((x) => x.id === 'u1')
    expect(u?.availableSlots.map((s) => s.id)).toEqual([dh2.id])
  })
  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'u1',
        organizationId: 'o1',
      }),
    ).rejects.toThrow('User not found')
  })
})
