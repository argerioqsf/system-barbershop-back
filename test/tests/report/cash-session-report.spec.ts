import { describe, it, expect, beforeEach } from 'vitest'
import { CashSessionReportService } from '../../../src/services/report/cash-session-report'
import { FakeCashRegisterRepository } from '../../helpers/fake-repositories'
import { PaymentMethod, PaymentStatus, TransactionType } from '@prisma/client'

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
          isLoan: true,
          receiptUrl: null,
          saleId: null,
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
          isLoan: true,
          receiptUrl: null,
          saleId: null,
        },
      ],
      sales: [
        {
          id: 'sale1',
          userId: 'u1',
          clientId: 'c1',
          unitId: 'unit-1',
          total: 150,
          method: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PAID,
          createdAt: new Date(),
          coupon: null,
          sessionId: 'ss-1',
          couponId: 'cp-1',
          observation: 'Pagamento no balcão' as string | null,
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
              service: {
                name: 'Cut',
                price: 100,
                id: '',
                description: null,
                imageUrl: null,
                cost: 0,
                categoryId: null,
                defaultTime: null,
                commissionPercentage: null,
                unitId: '',
              },
              appointmentId: null,
            },
          ],
          user: {
            id: 'u1',
            name: 'user',
            active: true,
            createdAt: new Date(),
            email: 'email',
            organizationId: 'org-1',
            password: '123456',
            unitId: 'unit-1',
            versionToken: 1,
            versionTokenInvalidate: 0,
            profile: {
              commissionPercentage: 50,
              id: '',
              phone: '',
              cpf: '',
              genre: '',
              birthday: '',
              pix: '',
              roleId: '',
              totalBalance: 0,
              userId: '',
              createdAt: new Date(),
            },
          },
        },
      ],
      user: {
        id: 'u1',
        name: 'user',
        active: true,
        createdAt: new Date(),
        email: 'email',
        organizationId: 'org-1',
        password: '123456',
        unitId: 'unit-1',
        versionToken: 1,
        versionTokenInvalidate: 0,
      },
    }

    const res = await service.execute({ sessionId: 's1' })
    expect(res.totalIn).toBe(100)
    expect(res.totalOut).toBe(40)
    expect(res.totalByService.Cut).toBe(100)
    expect(res.barberCommissions.u1).toBe(50)
    expect(res.ownerTotal).toBe(50)
  })
})
