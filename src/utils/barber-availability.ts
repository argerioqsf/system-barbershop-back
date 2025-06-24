import { AppointmentRepository } from '@/repositories/appointment-repository'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import {
  BarberService,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  User,
} from '@prisma/client'
import { timeToMinutes, intervalsOverlap, mergeIntervals } from './time'

export type BarberWithHours = User & {
  profile:
    | (Profile & {
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
        barberServices: BarberService[]
      })
    | null
}

export async function countAvailableSlots(
  barber: BarberWithHours,
  appointmentRepo: AppointmentRepository,
  dayHourRepo: DayHourRepository,
): Promise<number> {
  if (!barber.profile) return 0
  const workIds = barber.profile.workHours.map((w) => w.dayHourId)
  if (workIds.length === 0) return 0
  const workHours = await dayHourRepo.findMany({ id: { in: workIds } })
  const blocked = new Set(barber.profile.blockedHours.map((b) => b.dayHourId))
  const availableHours = workHours.filter((dh) => !blocked.has(dh.id))
  const slots = availableHours.map((dh) => ({
    id: dh.id,
    weekDay: dh.weekDay,
    start: timeToMinutes(dh.startHour),
    end: timeToMinutes(dh.endHour),
  }))
  if (slots.length === 0) return 0
  const appointments = await appointmentRepo.findMany({ barberId: barber.id })
  const taken = new Set<string>()
  for (const app of appointments) {
    const start = timeToMinutes(app.hour)
    const dur =
      app.durationService ?? app.service.defaultTime ?? 0
    const end = start + dur
    const wDay = app.date.getDay()
    for (const slot of slots) {
      if (slot.weekDay !== wDay) continue
      if (intervalsOverlap(start, end, slot.start, slot.end)) {
        taken.add(slot.id)
      }
    }
  }
  return slots.filter((s) => !taken.has(s.id)).length
}

export async function isAppointmentAvailable(
  barber: BarberWithHours,
  date: Date,
  startHour: string,
  duration: number,
  appointmentRepo: AppointmentRepository,
  dayHourRepo: DayHourRepository,
): Promise<boolean> {
  if (!barber.profile) return false
  const weekDay = date.getDay()
  const workIds = barber.profile.workHours.map((w) => w.dayHourId)
  if (workIds.length === 0) return false
  const workHours = await dayHourRepo.findMany({ id: { in: workIds }, weekDay })
  const blocked = new Set(barber.profile.blockedHours.map((b) => b.dayHourId))
  const available = workHours
    .filter((dh) => !blocked.has(dh.id))
    .map((dh) => ({ start: timeToMinutes(dh.startHour), end: timeToMinutes(dh.endHour) }))
  if (available.length === 0) return false
  const ranges = mergeIntervals(available)
  const start = timeToMinutes(startHour)
  const end = start + duration
  const fits = ranges.some((r) => start >= r.start && end <= r.end)
  if (!fits) return false
  const existing = await appointmentRepo.findMany({ barberId: barber.id, date })
  for (const app of existing) {
    const aStart = timeToMinutes(app.hour)
    const dur = app.durationService ?? app.service.defaultTime ?? 0
    const aEnd = aStart + dur
    if (intervalsOverlap(start, end, aStart, aEnd)) return false
  }
  return true
}
