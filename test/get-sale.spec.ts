import { describe, it, expect, beforeEach } from 'vitest'
import { GetSaleService } from '../src/services/sale/get-sale'
import { FakeSaleRepository } from './helpers/fake-repositories'

describe('Get sale service', () => {
  let repo: FakeSaleRepository
  let service: GetSaleService

  const sale = {
    id: 'sale-1',
    userId: 'u1',
    clientId: 'c1',
    unitId: 'unit-1',
    total: 100,
    method: 'CASH',
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    items: [],
    user: {},
    client: {},
    coupon: null,
    session: null,
    transaction: null,
  } as any

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(sale)
    service = new GetSaleService(repo)
  })

  it('returns sale when found', async () => {
    const res = await service.execute({ id: 'sale-1' })
    expect(res.sale?.id).toBe('sale-1')
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'other' })
    expect(res.sale).toBeNull()
  })
})

