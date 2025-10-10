import { describe, it, expect, beforeEach } from 'vitest'
import { ListServicesService } from '../../../src/services/service/list-services'
import { FakeServiceRepository } from '../../helpers/fake-repositories'
import { makeService } from '../../helpers/default-values'

const s1 = { ...makeService('s1', 10), organizationId: 'org-1' }
const s2 = {
  ...makeService('s2', 20),
  unitId: 'unit-2',
  organizationId: 'org-2',
}

describe('List services service', () => {
  let repo: FakeServiceRepository
  let service: ListServicesService

  beforeEach(() => {
    repo = new FakeServiceRepository([s1, s2])
    service = new ListServicesService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.items).toHaveLength(1)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0].id).toBe('s2')
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
