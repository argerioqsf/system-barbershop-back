import { describe, it, expect, beforeEach } from 'vitest'
import { SalesReportService } from '../src/services/report/sales-report'
import { FakeSaleRepository } from './helpers/fake-repositories'

describe('Sales report service', () => {
  let repo: FakeSaleRepository
  let service: SalesReportService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    service = new SalesReportService(repo)
  })

  it('totals sales in date range', async () => {
    repo.sales.push(
      {
        id: 's1',
        userId: 'u',
        clientId: 'c',
        unitId: 'unit-1',
        total: 100,
        method: 'CASH',
        paymentStatus: 'PAID',
        createdAt: new Date('2023-01-01'),
        items: [],
        user: {},
        client: {},
        coupon: null,
        session: null,
        transaction: null,
      } as any,
      {
        id: 's2',
        userId: 'u',
        clientId: 'c',
        unitId: 'unit-1',
        total: 150,
        method: 'CASH',
        paymentStatus: 'PAID',
        createdAt: new Date('2023-01-03'),
        items: [],
        user: {},
        client: {},
        coupon: null,
        session: null,
        transaction: null,
      } as any,
    )

    const res = await service.execute({
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-02'),
    })
    expect(res.total).toBe(100)
    expect(res.count).toBe(1)
  })
})

