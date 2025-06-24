import { describe, it, expect, beforeEach } from 'vitest'
import { ListProductsService } from '../../../src/services/product/list-products'
import { FakeProductRepository } from '../../helpers/fake-repositories'
import { makeProduct } from '../../helpers/default-values'

const p1 = { ...makeProduct('p1', 10), organizationId: 'org-1' }
const p2 = {
  ...makeProduct('p2', 20),
  unitId: 'unit-2',
  organizationId: 'org-2',
}

describe('List products service', () => {
  let repo: FakeProductRepository
  let service: ListProductsService

  beforeEach(() => {
    repo = new FakeProductRepository([p1, p2])
    service = new ListProductsService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.products).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.products).toHaveLength(1)
    expect(res.products[0].id).toBe('p1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    })
    expect(res.products).toHaveLength(1)
    expect(res.products[0].id).toBe('p2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'unit-1',
        organizationId: 'org-1',
      }),
    ).rejects.toThrow('User not found')
  })
})
