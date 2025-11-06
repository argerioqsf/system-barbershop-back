export type AppointmentTelemetryOperation =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.availability_checked'

export interface AppointmentTelemetryEvent {
  operation: AppointmentTelemetryOperation
  appointmentId?: string
  actorId?: string
  metadata?: Record<string, unknown>
}

export interface AppointmentTelemetry {
  record(event: AppointmentTelemetryEvent): Promise<void>
}
