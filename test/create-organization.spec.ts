import { describe, it, expect, beforeEach } from 'vitest'
import { CreateOrganizationService } from '../src/services/organization/create-organization'
import { FakeOrganizationRepository } from './helpers/fake-repositories'
import { defaultOrganization } from './helpers/default-values'

describe('Create organization service', () => {
  let repo: FakeOrganizationRepository
  let service: CreateOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository({ ...defaultOrganization }, [{ ...defaultOrganization }])
    service = new CreateOrganizationService(repo)
  })

  it('creates an organization', async () => {
    const res = await service.execute({ name: 'New Org', slug: 'new' })
    expect(res.organization.name).toBe('New Org')
    expect(repo.organizations).toHaveLength(2)
  })
})
