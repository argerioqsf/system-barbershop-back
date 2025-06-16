import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteOrganizationService } from '../src/services/organization/delete-organization'
import { FakeOrganizationRepository } from './helpers/fake-repositories'

const org = { id: 'org-1', name: 'Org', slug: 'org', ownerId: null, totalBalance: 0, createdAt: new Date() }

describe('Delete organization service', () => {
  let repo: FakeOrganizationRepository
  let service: DeleteOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository(org, [org])
    service = new DeleteOrganizationService(repo)
  })

  it('deletes organization', async () => {
    await service.execute('org-1')
    expect(repo.organizations).toHaveLength(0)
  })
})
