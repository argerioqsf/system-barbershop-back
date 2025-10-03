import { logger } from '@/lib/logger'
import {
  AppointmentTelemetry,
  AppointmentTelemetryEvent,
} from '@/modules/appointment/application/contracts/appointment-telemetry'

export class LoggerAppointmentTelemetry implements AppointmentTelemetry {
  async record(event: AppointmentTelemetryEvent): Promise<void> {
    logger.info('appointment.telemetry', {
      operation: event.operation,
      appointmentId: event.appointmentId,
      actorId: event.actorId,
      metadata: event.metadata,
    })
  }
}
