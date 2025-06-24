import { AppointmentRepository } from '@/repositories/appointment-repository'
import {
  BarberService,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  User,
} from '@prisma/client'
import {
  timeToMinutes,
  mergeIntervals,
  subtractIntervals,
  minutesToTime,
} from './time'

export type BarberWithHours = User & {
  profile:
    | (Profile & {
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
        barberServices: BarberService[]
      })
    | null
}

export interface AvailableSlot {
  id: string
  weekDay: number
  startHour: string
  endHour: string
}

export async function listAvailableSlots(
  barber: BarberWithHours,
  appointmentRepo: AppointmentRepository,
): Promise<AvailableSlot[]> {
  if (!barber.profile) return []
  const workHours = barber.profile.workHours
  if (workHours.length === 0) return []

  const blockedMap = new Map<number, { start: number; end: number }[]>()
  for (const b of barber.profile.blockedHours) {
    const day = b.startHour.getDay()
    const list = blockedMap.get(day) ?? []
    list.push({
      start: timeToMinutes(b.startHour),
      end: timeToMinutes(b.endHour),
    })
    blockedMap.set(day, list)
  }

  const appointments = await appointmentRepo.findMany({ barberId: barber.id })
  const appMap = new Map<number, { start: number; end: number }[]>()
  for (const app of appointments) {
    const day = app.date.getDay()
    const start = timeToMinutes(app.date)
    const dur = app.durationService ?? app.service.defaultTime ?? 0
    const end = start + dur
    const list = appMap.get(day) ?? []
    list.push({ start, end })
    appMap.set(day, list)
  }

  const result: AvailableSlot[] = []
  for (const dh of workHours) {
    const base = [
      { start: timeToMinutes(dh.startHour), end: timeToMinutes(dh.endHour) },
    ]
    const blocked = blockedMap.get(dh.weekDay) ?? []
    const apps = appMap.get(dh.weekDay) ?? []
    let ranges = subtractIntervals(base, blocked)
    ranges = subtractIntervals(ranges, apps)
    for (const [index, r] of ranges.entries()) {
      if (r.end <= r.start) continue
      result.push({
        id: `${dh.id}-${index}`,
        weekDay: dh.weekDay,
        startHour: minutesToTime(r.start),
        endHour: minutesToTime(r.end),
      })
    }
  }
  return result
}

export async function isAppointmentAvailable(
  barber: BarberWithHours,
  startTime: Date,
  duration: number,
  appointmentRepo: AppointmentRepository,
): Promise<boolean> {
  if (!barber.profile) return false
  const weekDay = startTime.getDay()
  const workHours = barber.profile.workHours.filter(
    (w) => w.weekDay === weekDay,
  )
  if (workHours.length === 0) return false
  const blockedHours = barber.profile.blockedHours.filter(
    (b) =>
      b.startHour.getDay() === weekDay &&
      b.startHour.toDateString() === startTime.toDateString(),
  )
  const blockedIntervals = blockedHours.map((b) => ({
    start: timeToMinutes(b.startHour),
    end: timeToMinutes(b.endHour),
  }))
  const workRanges = workHours.map((dh) => ({
    start: timeToMinutes(dh.startHour),
    end: timeToMinutes(dh.endHour),
  }))
  let ranges = subtractIntervals(workRanges, blockedIntervals)
  const existing = (await appointmentRepo.findMany({ barberId: barber.id }))
    .filter((a) => a.date.toDateString() === startTime.toDateString())
    .map((a) => ({
      start: timeToMinutes(a.date),
      end:
        timeToMinutes(a.date) +
        (a.durationService ?? a.service.defaultTime ?? 0),
    }))
  ranges = subtractIntervals(ranges, existing)
  ranges = mergeIntervals(ranges)
  if (ranges.length === 0) return false
  const start = timeToMinutes(startTime)
  const end = start + duration
  const fits = ranges.some((r) => start >= r.start && end <= r.end)
  if (!fits) return false
  return true
}
