import {
  SaleTelemetry,
  SaleTelemetryEvent,
} from '../../../src/modules/sale/application/ports/sale-telemetry'

export class FakeSaleTelemetry implements SaleTelemetry {
  public events: SaleTelemetryEvent[] = []

  async record(event: SaleTelemetryEvent): Promise<void> {
    this.events.push(event)
  }
}
