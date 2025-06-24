import { AppointmentRepository } from '@/repositories/appointment-repository'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import {
  BarberService,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  User,
  DayHour,
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

export async function listAvailableSlots(
  barber: BarberWithHours,
  appointmentRepo: AppointmentRepository,
  dayHourRepo: DayHourRepository,
): Promise<DayHour[]> {
  if (!barber.profile) return []
  const workIds = barber.profile.workHours.map((w) => w.dayHourId)
  if (workIds.length === 0) return []
  const workHours = await dayHourRepo.findMany({ id: { in: workIds } })
  const blocked = new Set(
    barber.profile.blockedHours.map(
      (b) => `${timeToMinutes(b.startHour)}-${timeToMinutes(b.endHour)}-${b.startHour.getDay()}`,
    ),
  )
  const availableHours = workHours.filter(
    (dh) =>
      !blocked.has(
        `${timeToMinutes(dh.startHour)}-${timeToMinutes(dh.endHour)}-${dh.weekDay}`,
      ),
  )
  const slots = availableHours.map((dh) => ({
    id: dh.id,
    weekDay: dh.weekDay,
    start: timeToMinutes(dh.startHour),
    end: timeToMinutes(dh.endHour),
    dh,
  }))
  if (slots.length === 0) return []
  const appointments = await appointmentRepo.findMany({ barberId: barber.id })
  const taken = new Set<string>()
  for (const app of appointments) {
    const start = timeToMinutes(app.date)
    const dur = app.durationService ?? app.service.defaultTime ?? 0
    const end = start + dur
    const wDay = app.date.getDay()
    for (const slot of slots) {
      if (slot.weekDay !== wDay) continue
      if (intervalsOverlap(start, end, slot.start, slot.end)) {
        taken.add(slot.id)
      }
    }
  }
  return slots.filter((s) => !taken.has(s.id)).map((s) => s.dh)
}

export async function isAppointmentAvailable(
  barber: BarberWithHours,
  startTime: Date,
  duration: number,
  appointmentRepo: AppointmentRepository,
  dayHourRepo: DayHourRepository,
): Promise<boolean> {
  if (!barber.profile) return false
  const weekDay = startTime.getDay()
  const workIds = barber.profile.workHours.map((w) => w.dayHourId)
  if (workIds.length === 0) return false
  const workHours = await dayHourRepo.findMany({ id: { in: workIds }, weekDay })
  const blockedHours = barber.profile.blockedHours.filter(
    (b) => b.startHour.getDay() === weekDay && b.startHour.toDateString() === startTime.toDateString(),
  )
  const blockedIntervals = blockedHours.map((b) => ({
    start: timeToMinutes(b.startHour),
    end: timeToMinutes(b.endHour),
  }))
  const available = workHours
    .map((dh) => ({
      start: timeToMinutes(dh.startHour),
      end: timeToMinutes(dh.endHour),
    }))
    .filter((range) =>
      !blockedIntervals.some((b) => intervalsOverlap(range.start, range.end, b.start, b.end)),
    )
  if (available.length === 0) return false
  const ranges = mergeIntervals(available)
  const start = timeToMinutes(startTime)
  const end = start + duration
  const fits = ranges.some((r) => start >= r.start && end <= r.end)
  if (!fits) return false
  const existing = await appointmentRepo.findMany({ barberId: barber.id })
  for (const app of existing) {
    const aStart = timeToMinutes(app.date)
    const dur = app.durationService ?? app.service.defaultTime ?? 0
    const aEnd = aStart + dur
    if (intervalsOverlap(start, end, aStart, aEnd)) return false
  }
  return true
}
