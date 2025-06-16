import { describe, it, expect, beforeEach } from 'vitest'
import { ListOrganizationsService } from '../src/services/organization/list-organizations'
import { FakeOrganizationRepository } from './helpers/fake-repositories'
import { makeOrganization } from './helpers/default-values'

const o1 = makeOrganization('org-1', 'A', 'a')
const o2 = makeOrganization('org-2', 'B', 'b')

describe('List organizations service', () => {
  let repo: FakeOrganizationRepository
  let service: ListOrganizationsService

  beforeEach(() => {
    repo = new FakeOrganizationRepository(o1, [o1, o2])
    service = new ListOrganizationsService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({ sub: '1', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.organizations).toHaveLength(2)
  })

  it('returns organization of user for others', async () => {
    const res = await service.execute({ sub: '1', role: 'BARBER', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.organizations).toHaveLength(1)
    expect(res.organizations[0].id).toBe('org-1')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({ sub: '', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any),
    ).rejects.toThrow('User not found')
  })
})
