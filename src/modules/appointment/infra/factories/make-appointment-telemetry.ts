import { LoggerAppointmentTelemetry } from '@/modules/appointment/infra/telemetry/logger-appointment-telemetry'

export function makeAppointmentTelemetry() {
  return new LoggerAppointmentTelemetry()
}
