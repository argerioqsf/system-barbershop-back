import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserPendingCommissionsService } from '../../../src/services/users/list-user-pending-commissions'
import {
  FakeSaleRepository,
  FakeSaleItemRepository,
} from '../../helpers/fake-repositories'
import { makeSaleWithBarber, makeProfile, makeUser, defaultUnit } from '../../helpers/default-values'

function setup() {
  const saleRepo = new FakeSaleRepository()
  const saleItemRepo = new FakeSaleItemRepository(saleRepo)
  const service = new ListUserPendingCommissionsService(saleItemRepo)
  return { saleRepo, saleItemRepo, service }
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
    expect(res.saleItems).toHaveLength(1)
    expect(res.saleItems[0].saleItemId).toBe('it1')
  })
})
