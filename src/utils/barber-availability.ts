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
  Intervals,
  IntervalsFormatted,
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
  referenceDate: Date = new Date(), // Data base da semana
  dayFilter?: number, // Se passado, verifica apenas um dia específico (0 = domingo, ..., 6 = sábado)
): Promise<IntervalsFormatted[]> {
  if (!barber.profile) return []
  const workHours = barber.profile.workHours
  if (workHours.length === 0) return []

  // Define início e fim da semana de referência
  const startOfWeek = new Date(referenceDate)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay()) // domingo

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7) // sábado 23:59:59

  const isSameDay = (date: Date) =>
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth() &&
    date.getUTCDate() === referenceDate.getUTCDate()

  const isInCurrentWeek = (date: Date) =>
    date >= startOfWeek && date < endOfWeek

  const shouldIncludeDate = (date: Date) =>
    dayFilter !== undefined
      ? date.getUTCDay() === dayFilter && isSameDay(date)
      : isInCurrentWeek(date)

  // Map de bloqueios
  const blockedMap = new Map<number, Intervals[]>()
  for (const b of barber.profile.blockedHours) {
    if (!shouldIncludeDate(b.startHour)) continue
    const day = b.startHour.getUTCDay()
    const list = blockedMap.get(day) ?? []
    list.push({
      start: timeToMinutes(b.startHour),
      end: timeToMinutes(b.endHour),
    })
    blockedMap.set(day, list)
  }

  // Agendamentos
  const appointments = await appointmentRepo.findMany({ barberId: barber.id })
  const appMap = new Map<number, Intervals[]>()
  for (const app of appointments) {
    if (!shouldIncludeDate(app.date)) continue
    const day = app.date.getUTCDay()
    const start = timeToMinutes(app.date)
    const dur =
      app.durationService ??
      app.services.reduce((acc, s) => {
        const svc = s.service ?? s
        return acc + (svc.defaultTime ?? 0)
      }, 0)
    const end = start + dur
    const list = appMap.get(day) ?? []
    list.push({ start, end })
    appMap.set(day, list)
  }

  const result: AvailableSlot[] = []
  for (const dh of workHours) {
    if (dayFilter !== undefined && dh.weekDay !== dayFilter) continue

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

  const ordenado = result
    .map((rst) => ({
      start: timeToMinutes(rst.startHour),
      end: timeToMinutes(rst.endHour),
      weekDay: rst.weekDay,
    }))
    .sort((a, b) => a.start - b.start)
    .sort((a, b) => a.weekDay - b.weekDay)
    .map((rst) => ({
      start: minutesToTime(rst.start),
      end: minutesToTime(rst.end),
      weekDay: rst.weekDay,
    }))

  return ordenado
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
        (a.durationService ??
          a.services.reduce((acc, s) => {
            const svc = s.service ?? s
            return acc + (svc.defaultTime ?? 0)
          }, 0)),
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
