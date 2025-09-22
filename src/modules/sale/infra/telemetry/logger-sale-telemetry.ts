import { logger } from '@/lib/logger'
import {
  SaleTelemetry,
  SaleTelemetryEvent,
} from '@/modules/sale/application/contracts/sale-telemetry'

export class LoggerSaleTelemetry implements SaleTelemetry {
  async record(event: SaleTelemetryEvent): Promise<void> {
    logger.info('sale.telemetry', {
      operation: event.operation,
      saleId: event.saleId,
      actorId: event.actorId,
      metadata: event.metadata,
    })
  }
}

