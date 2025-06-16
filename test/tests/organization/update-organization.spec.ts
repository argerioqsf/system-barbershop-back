import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateOrganizationService } from '../../../src/services/organization/update-organization'
import { FakeOrganizationRepository } from '../../helpers/fake-repositories'
import { defaultOrganization } from '../../helpers/default-values'

describe('Update organization service', () => {
  let repo: FakeOrganizationRepository
  let service: UpdateOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository({ ...defaultOrganization }, [{ ...defaultOrganization }])
    service = new UpdateOrganizationService(repo)
  })

  it('updates organization data', async () => {
    const res = await service.execute({ id: 'org-1', name: 'New', slug: 'new' })
    expect(res.organization.name).toBe('New')
    expect(repo.organizations[0].slug).toBe('new')
  })
})
