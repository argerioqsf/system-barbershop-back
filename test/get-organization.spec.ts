import { describe, it, expect, beforeEach } from 'vitest'
import { GetOrganizationService } from '../src/services/organization/get-organization'
import { FakeOrganizationRepository } from './helpers/fake-repositories'

const org = { id: 'org-1', name: 'Org', slug: 'org', ownerId: null, totalBalance: 0, createdAt: new Date() }

describe('Get organization service', () => {
  let repo: FakeOrganizationRepository
  let service: GetOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository(org, [org])
    service = new GetOrganizationService(repo)
  })

  it('returns organization when found', async () => {
    const res = await service.execute('org-1')
    expect(res.organization?.id).toBe('org-1')
  })

  it('returns null when not found', async () => {
    const res = await service.execute('other')
    expect(res.organization).toBeNull()
  })
})
