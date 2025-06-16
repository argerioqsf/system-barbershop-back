import { describe, it, expect, beforeEach } from 'vitest'
import { CashSessionReportService } from '../src/services/report/cash-session-report'
import { FakeCashRegisterRepository } from './helpers/fake-repositories'
import { TransactionType } from '@prisma/client'

describe('Cash session report service', () => {
  let repo: FakeCashRegisterRepository
  let service: CashSessionReportService

  beforeEach(() => {
    repo = new FakeCashRegisterRepository()
    service = new CashSessionReportService(repo)
  })

  it('calculates totals from session', async () => {
    repo.session = {
      id: 's1',
      openedById: 'u1',
      unitId: 'unit-1',
      openedAt: new Date(),
      closedAt: null,
      initialAmount: 0,
      finalAmount: null,
      transactions: [
        {
          id: 't1',
          userId: 'u1',
          affectedUserId: null,
          unitId: 'unit-1',
          cashRegisterSessionId: 's1',
          type: TransactionType.ADDITION,
          description: '',
          amount: 100,
          createdAt: new Date(),
        },
        {
          id: 't2',
          userId: 'u1',
          affectedUserId: null,
          unitId: 'unit-1',
          cashRegisterSessionId: 's1',
          type: TransactionType.WITHDRAWAL,
          description: '',
          amount: 40,
          createdAt: new Date(),
        },
      ],
      sales: [
        {
          id: 'sale1',
          userId: 'u1',
          clientId: 'c1',
          unitId: 'unit-1',
          total: 150,
          method: 'CASH',
          paymentStatus: 'PAID',
          createdAt: new Date(),
          items: [
            {
              id: 'i1',
              saleId: 'sale1',
              serviceId: 'srv1',
              productId: null,
              quantity: 1,
              barberId: null,
              couponId: null,
              price: 0,
              discount: null,
              discountType: null,
              porcentagemBarbeiro: null,
              service: { name: 'Cut', price: 100 },
              product: null,
              barber: null,
              coupon: null,
            },
          ],
          user: { id: 'u1', profile: { commissionPercentage: 50 } },
          client: {},
          coupon: null,
          session: null,
          transaction: null,
        },
      ],
    } as any

    const res = await service.execute({ sessionId: 's1' })
    expect(res.totalIn).toBe(100)
    expect(res.totalOut).toBe(40)
    expect(res.totalByService['Cut']).toBe(100)
    expect(res.barberCommissions['u1']).toBe(50)
    expect(res.ownerTotal).toBe(50)
  })
})

