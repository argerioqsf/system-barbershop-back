import { describe, it, expect, beforeEach } from 'vitest'
import { ListCouponsService } from '../src/services/coupon/list-coupons'
import { FakeCouponRepository } from './helpers/fake-repositories'

const c1 = { id: 'c1', code: 'C1', description: null, discount: 10, discountType: 'VALUE', imageUrl: null, quantity: 5, unitId: 'unit-1', organizationId: 'org-1', createdAt: new Date() } as any
const c2 = { id: 'c2', code: 'C2', description: null, discount: 20, discountType: 'VALUE', imageUrl: null, quantity: 5, unitId: 'unit-2', organizationId: 'org-2', createdAt: new Date() } as any

describe('List coupons service', () => {
  let repo: FakeCouponRepository
  let service: ListCouponsService

  beforeEach(() => {
    repo = new FakeCouponRepository([c1, c2])
    service = new ListCouponsService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({ sub: '1', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.coupons).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({ sub: '1', role: 'OWNER', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.coupons).toHaveLength(1)
    expect(res.coupons[0].id).toBe('c1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({ sub: '1', role: 'BARBER', unitId: 'unit-2', organizationId: 'org-2' } as any)
    expect(res.coupons).toHaveLength(1)
    expect(res.coupons[0].id).toBe('c2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({ sub: '', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any),
    ).rejects.toThrow('User not found')
  })
})
