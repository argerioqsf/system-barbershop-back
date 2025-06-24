import { describe, it, expect, beforeEach } from 'vitest'
import {
  listAvailableSlots,
  isAppointmentAvailable,
} from '../../../src/utils/barber-availability'
import {
  FakeAppointmentRepository,
  FakeDayHourRepository,
} from '../../helpers/fake-repositories'
import {
  barberUser,
  barberProfile,
  makeService,
  makeAppointment,
} from '../../helpers/default-values'

describe('barber availability utils', () => {
  let appointmentRepo: FakeAppointmentRepository
  let dayHourRepo: FakeDayHourRepository
  let barber: typeof barberUser & { profile: typeof barberProfile }

  beforeEach(() => {
    appointmentRepo = new FakeAppointmentRepository()
    dayHourRepo = new FakeDayHourRepository()
    barber = {
      ...barberUser,
      profile: { ...barberProfile, workHours: [], blockedHours: [] },
    }
  })

  it('returns empty slots when no profile', async () => {
    const res = await listAvailableSlots(
      { ...barberUser, profile: null } as any,
      appointmentRepo,
      dayHourRepo,
    )
    expect(res).toEqual([])
  })

  it('returns empty slots when no work hours', async () => {
    const res = await listAvailableSlots(barber as any, appointmentRepo, dayHourRepo)
    expect(res).toEqual([])
  })

  it('lists available slots excluding blocked hours and appointments', async () => {
    const dh = await dayHourRepo.create({
      weekDay: 1,
      startHour: '09:00',
      endHour: '11:00',
    })
    barber.profile.workHours.push({
      id: 'wh1',
      profileId: barber.profile.id,
      dayHourId: dh.id,
    })
    barber.profile.blockedHours.push({
      id: 'bh1',
      profileId: barber.profile.id,
      startHour: new Date('2024-01-01T10:00:00'),
      endHour: new Date('2024-01-01T10:30:00'),
    })
    const svc = makeService('svc1', 100)
    const app = makeAppointment('app1', svc, {
      date: new Date('2024-01-01T09:30:00'),
      durationService: 30,
    })
    appointmentRepo.appointments.push({ ...app, barberId: barber.id, barber })

    const res = await listAvailableSlots(barber as any, appointmentRepo, dayHourRepo)
    expect(res).toEqual([
      expect.objectContaining({ startHour: '09:00', endHour: '09:30' }),
      expect.objectContaining({ startHour: '10:30', endHour: '11:00' }),
    ])
  })

  it('returns false if barber has no profile', async () => {
    const result = await isAppointmentAvailable(
      { ...barberUser, profile: null } as any,
      new Date('2024-01-01T09:00:00'),
      30,
      appointmentRepo,
      dayHourRepo,
    )
    expect(result).toBe(false)
  })

  it('returns false when no work hours', async () => {
    const result = await isAppointmentAvailable(
      barber as any,
      new Date('2024-01-01T09:00:00'),
      30,
      appointmentRepo,
      dayHourRepo,
    )
    expect(result).toBe(false)
  })

  it('returns false when appointment overlaps blocked hour', async () => {
    const dh = await dayHourRepo.create({
      weekDay: 1,
      startHour: '09:00',
      endHour: '11:00',
    })
    barber.profile.workHours.push({
      id: 'wh1',
      profileId: barber.profile.id,
      dayHourId: dh.id,
    })
    barber.profile.blockedHours.push({
      id: 'bh1',
      profileId: barber.profile.id,
      startHour: new Date('2024-01-01T10:00:00'),
      endHour: new Date('2024-01-01T10:30:00'),
    })

    const result = await isAppointmentAvailable(
      barber as any,
      new Date('2024-01-01T10:15:00'),
      30,
      appointmentRepo,
      dayHourRepo,
    )
    expect(result).toBe(false)
  })

  it('returns false when overlapping appointment exists', async () => {
    const dh = await dayHourRepo.create({
      weekDay: 1,
      startHour: '09:00',
      endHour: '11:00',
    })
    barber.profile.workHours.push({
      id: 'wh1',
      profileId: barber.profile.id,
      dayHourId: dh.id,
    })
    const svc = makeService('svc1', 100)
    const app = makeAppointment('app1', svc, {
      date: new Date('2024-01-01T09:00:00'),
      durationService: 60,
    })
    appointmentRepo.appointments.push({ ...app, barberId: barber.id, barber })

    const result = await isAppointmentAvailable(
      barber as any,
      new Date('2024-01-01T09:30:00'),
      30,
      appointmentRepo,
      dayHourRepo,
    )
    expect(result).toBe(false)
  })

  it('returns true when slot is free', async () => {
    const dh = await dayHourRepo.create({
      weekDay: 1,
      startHour: '09:00',
      endHour: '11:00',
    })
    barber.profile.workHours.push({
      id: 'wh1',
      profileId: barber.profile.id,
      dayHourId: dh.id,
    })

    const result = await isAppointmentAvailable(
      barber as any,
      new Date('2024-01-01T09:00:00'),
      30,
      appointmentRepo,
      dayHourRepo,
    )
    expect(result).toBe(true)
  })
})
