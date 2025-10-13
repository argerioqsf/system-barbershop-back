import { logger } from '@/lib/logger'
import {
  CollaboratorTelemetry,
  CollaboratorTelemetryEvent,
} from '@/modules/collaborator/application/contracts/collaborator-telemetry'

export class LoggerCollaboratorTelemetry implements CollaboratorTelemetry {
  async record(event: CollaboratorTelemetryEvent): Promise<void> {
    logger.info('collaborator.telemetry', {
      operation: event.operation,
      collaboratorId: event.collaboratorId,
      metadata: event.metadata,
    })
  }
}
