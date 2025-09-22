import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoggerSaleTelemetry } from '../../../src/modules/sale/infra/telemetry/logger-sale-telemetry'
import { logger } from '../../../src/lib/logger'

vi.mock('../../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}))

describe('LoggerSaleTelemetry', () => {
  const telemetry = new LoggerSaleTelemetry()

  beforeEach(() => {
    vi.mocked(logger.info).mockClear()
  })

  it('logs the telemetry event', async () => {
    await telemetry.record({
      operation: 'sale.test',
      saleId: 'sale-1',
      actorId: 'actor-1',
      metadata: { foo: 'bar' },
    })

    expect(logger.info).toHaveBeenCalledWith('sale.telemetry', {
      operation: 'sale.test',
      saleId: 'sale-1',
      actorId: 'actor-1',
      metadata: { foo: 'bar' },
    })
  })
})
