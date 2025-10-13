import { describe, it, expect, beforeEach } from 'vitest'
import { GetSaleUseCase } from '../../../src/modules/sale/application/use-cases/get-sale'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'
import { FakeSaleTelemetry } from '../../helpers/sale/fakes/fake-sale-telemetry'

describe('Get sale service', () => {
  let repo: FakeSaleRepository
  let useCase: GetSaleUseCase
  let telemetry: FakeSaleTelemetry

  const sale = makeSale('sale-1')

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(sale)
    telemetry = new FakeSaleTelemetry()
    useCase = new GetSaleUseCase(repo, telemetry)
  })

  it('returns sale when found', async () => {
    const res = await useCase.execute({
      id: 'sale-1',
      actor: {
        id: 'user-1',
        unitId: 'unit-1',
        organizationId: 'organization-1',
        role: 'ADMIN',
        permissions: [],
      },
    })
    expect(res.sale?.id).toBe('sale-1')
    expect(telemetry.events).toHaveLength(1)
    expect(telemetry.events[0]).toMatchObject({
      operation: 'sale.viewed',
      saleId: 'sale-1',
      metadata: { found: true },
    })
  })

  it('returns null when not found', async () => {
    const res = await useCase.execute({
      id: 'other',
      actor: {
        id: 'user-1',
        unitId: 'unit-1',
        organizationId: 'organization-1',
        role: 'ADMIN',
        permissions: [],
      },
    })
    expect(res.sale).toBeNull()
    expect(telemetry.events.at(-1)).toMatchObject({
      operation: 'sale.viewed',
      saleId: 'other',
      metadata: { found: false },
    })
  })
})
