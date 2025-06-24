import { describe, it, expect, beforeEach } from 'vitest'
import { SalesReportService } from '../../../src/services/report/sales-report'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { defaultUser, makeSale } from '../../helpers/default-values'
import { PaymentStatus } from '@prisma/client'

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
        ...makeSale('s1', 'unit-1', 'org-1', PaymentStatus.PAID, 100),
        createdAt: new Date('2023-01-01'),
        sessionId: null,
        couponId: null,
        observation: null,
        user: defaultUser,
      },
      {
        ...makeSale('s2', 'unit-1', 'org-1', PaymentStatus.PAID, 150),
        createdAt: new Date('2023-01-03'),
      },
    )

    const res = await service.execute({
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-02'),
    })
    expect(res.total).toBe(100)
    expect(res.count).toBe(1)
  })
})
