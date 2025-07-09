import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserPendingCommissionsService } from '../../../src/services/users/list-user-pending-commissions'
import {
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeLoanRepository,
} from '../../helpers/fake-repositories'
import { makeSaleWithBarber, makeProfile, makeUser, defaultUnit } from '../../helpers/default-values'

function setup() {
  const saleRepo = new FakeSaleRepository()
  const saleItemRepo = new FakeSaleItemRepository(saleRepo)
  const loanRepo = new FakeLoanRepository()
  const service = new ListUserPendingCommissionsService(saleItemRepo, loanRepo)
  return { saleRepo, saleItemRepo, loanRepo, service }
}

describe('List user pending commissions', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('returns pending sale items', async () => {
    const profile = makeProfile('p5', 'u5', 0)
    const user = makeUser('u5', profile, defaultUnit)

    const sale1 = {
      ...makeSaleWithBarber(),
      id: 's1',
      paymentStatus: 'PAID',
      createdAt: new Date('2024-01-01'),
    }
    sale1.items[0].barberId = user.id
    sale1.items[0].id = 'it1'
    sale1.items[0].serviceId = 'svc1'
    ;(sale1.items[0] as any).commissionPaid = false
    const sale2 = { ...makeSaleWithBarber(), id: 's2', paymentStatus: 'PAID', createdAt: new Date('2024-01-02') }
    sale2.items[0].barberId = user.id
    sale2.items[0].id = 'it2'
    sale2.items[0].serviceId = 'svc2'
    ;(sale2.items[0] as any).commissionPaid = true

    ctx.saleRepo.sales.push(sale1 as any, sale2 as any)

    const res = await ctx.service.execute({ userId: user.id })
    expect(res.saleItemsRecords).toHaveLength(1)
    expect(res.saleItemsRecords[0].saleItemId).toBe('it1')
  })

  it('includes appointment service commissions', async () => {
    const profile = makeProfile('p6', 'u6', 0)
    const user = makeUser('u6', profile, defaultUnit)

    const sale = {
      ...makeSaleWithBarber(),
      id: 's-appt',
      paymentStatus: 'PAID',
    }
    sale.items[0].barberId = user.id
    sale.items[0].id = 'it-appt'
    sale.items[0].serviceId = 'svc-appt'
    sale.items[0].appointmentId = 'appt1'
    sale.items[0].appointment = {
      id: 'appt1',
      clientId: 'c1',
      barberId: user.id,
      unitId: defaultUnit.id,
      date: new Date('2024-01-01'),
      status: 'SCHEDULED',
      durationService: null,
      observation: null,
      discount: 0,
      value: null,
      services: [
        {
          id: 'aps1',
          appointmentId: 'appt1',
          serviceId: 'svc-appt',
          commissionPercentage: 50,
          commissionPaid: false,
          transactions: [],
          service: {
            id: 'svc-appt',
            name: '',
            description: null,
            imageUrl: null,
            cost: 0,
            price: 50,
            categoryId: null,
            defaultTime: null,
            commissionPercentage: null,
            unitId: defaultUnit.id,
          },
        },
      ],
    }
    ;(sale.items[0] as any).commissionPaid = false

    ctx.saleRepo.sales.push(sale as any)

    const res = await ctx.service.execute({ userId: user.id })

    expect(res.saleItemsRecords).toHaveLength(1)
    expect(res.saleItemsRecords[0].appointmentServiceId).toBe('aps1')
    expect(res.totalCommission).toBeGreaterThan(0)
  })
})
