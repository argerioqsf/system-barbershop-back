import { LoggerSaleTelemetry } from '@/modules/sale/infra/telemetry/logger-sale-telemetry'

export function makeSaleTelemetry() {
  return new LoggerSaleTelemetry()
}
