import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteOrganizationService } from '../../../src/services/organization/delete-organization'
import { FakeOrganizationRepository } from '../../helpers/fake-repositories'
import { defaultOrganization } from '../../helpers/default-values'

describe('Delete organization service', () => {
  let repo: FakeOrganizationRepository
  let service: DeleteOrganizationService

  beforeEach(() => {
    repo = new FakeOrganizationRepository({ ...defaultOrganization }, [
      { ...defaultOrganization },
    ])
    service = new DeleteOrganizationService(repo)
  })

  it('deletes organization', async () => {
    await service.execute('org-1')
    expect(repo.organizations).toHaveLength(0)
  })
})
