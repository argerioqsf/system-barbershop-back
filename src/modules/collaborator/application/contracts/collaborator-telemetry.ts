export interface CollaboratorTelemetryEvent {
  operation: string
  collaboratorId?: string
  metadata?: Record<string, unknown>
}

export interface CollaboratorTelemetry {
  record(event: CollaboratorTelemetryEvent): Promise<void> | void
}
