import { describe, it, expect, beforeEach } from 'vitest'
import { ListServicesService } from '../src/services/service/list-services'
import { FakeServiceRepository } from './helpers/fake-repositories'

const s1 = { id: 's1', name: 'A', description: null, imageUrl: null, cost: 0, price: 10, unitId: 'unit-1', organizationId: 'org-1' } as any
const s2 = { id: 's2', name: 'B', description: null, imageUrl: null, cost: 0, price: 20, unitId: 'unit-2', organizationId: 'org-2' } as any

describe('List services service', () => {
  let repo: FakeServiceRepository
  let service: ListServicesService

  beforeEach(() => {
    repo = new FakeServiceRepository([s1, s2])
    service = new ListServicesService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({ sub: '1', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.services).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({ sub: '1', role: 'OWNER', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.services).toHaveLength(1)
    expect(res.services[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({ sub: '1', role: 'BARBER', unitId: 'unit-2', organizationId: 'org-2' } as any)
    expect(res.services).toHaveLength(1)
    expect(res.services[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({ sub: '', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any),
    ).rejects.toThrow('User not found')
  })
})
