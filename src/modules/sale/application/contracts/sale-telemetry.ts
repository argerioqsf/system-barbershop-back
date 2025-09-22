export interface SaleTelemetryEvent {
  operation: string
  saleId?: string
  actorId?: string
  metadata?: Record<string, unknown>
}

export interface SaleTelemetry {
  record(event: SaleTelemetryEvent): Promise<void> | void
}
