import {
  SaleTelemetry,
  SaleTelemetryEvent,
} from '../../../src/modules/sale/application/contracts/sale-telemetry'

export class FakeSaleTelemetry implements SaleTelemetry {
  public events: SaleTelemetryEvent[] = []

  async record(event: SaleTelemetryEvent): Promise<void> {
    this.events.push(event)
  }
}

