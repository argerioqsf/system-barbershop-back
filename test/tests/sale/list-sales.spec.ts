import { describe, it, expect, beforeEach } from 'vitest'
import { ListSalesService } from '../../../src/services/sale/list-sales'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'

const s1 = makeSale('s1', 'unit-1', 'org-1')
const s2 = makeSale('s2', 'unit-2', 'org-2')

describe('List sales service', () => {
  let repo: FakeSaleRepository
  let service: ListSalesService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(s1, s2)
    service = new ListSalesService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.sales).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.sales).toHaveLength(1)
    expect(res.sales[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    } as any)
    expect(res.sales).toHaveLength(1)
    expect(res.sales[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'unit-1',
        organizationId: 'org-1',
      } as any),
    ).rejects.toThrow('User not found')
  })
})

