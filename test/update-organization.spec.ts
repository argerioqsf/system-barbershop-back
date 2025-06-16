import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateOrganizationService } from '../src/services/organization/update-organization'
import { FakeOrganizationRepository } from './helpers/fake-repositories'

const org = { id: 'org-1', name: 'Org', slug: 'org', ownerId: null, totalBalance: 0, createdAt: new Date() }

describe('Update organization service', () => {
  let repo: FakeOrganizationRepository
  let service: UpdateOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository(org, [org])
    service = new UpdateOrganizationService(repo)
  })

  it('updates organization data', async () => {
    const res = await service.execute({ id: 'org-1', name: 'New', slug: 'new' })
    expect(res.organization.name).toBe('New')
    expect(repo.organizations[0].slug).toBe('new')
  })
})
