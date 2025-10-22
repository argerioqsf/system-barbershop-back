// MIGRATION-TODO: substituir pelo repositório do módulo Scheduling quando migrado.
import type {
  AppointmentRepository as BaseAppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'

export type AppointmentRepository = BaseAppointmentRepository

export type { DetailedAppointment }
