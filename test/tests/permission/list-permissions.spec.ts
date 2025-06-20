import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListPermissionsService } from '../../../src/services/permission/list-permissions'
import { InMemoryPermissionRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makePermission, makeProfile } from '../../helpers/default-values'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'

const profileRepo = new FakeProfilesRepository()

vi.mock('../../../src/services/@factories/profile/get-profile-from-userId-service', () => ({
  getProfileFromUserIdService: () => new GetUserProfileFromUserIdService(profileRepo),
}))

const p1 = makePermission('p1', 'unit-1')
const p2 = makePermission('p2', 'unit-2')

describe('List permissions service', () => {
  let repo: InMemoryPermissionRepository
  let service: ListPermissionsService

  beforeEach(() => {
    repo = new InMemoryPermissionRepository([p1, p2])
    service = new ListPermissionsService(repo)
    const profile = makeProfile('prof-1', '1')
    ;(profile as any).permissions = [{ id: 'perm', name: 'LIST_PERMISSIONS' }]
    profileRepo.profiles = [profile]
  })

  it('lists permissions from user unit', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'MANAGER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.permissions).toHaveLength(1)
    expect(res.permissions[0].id).toBe('p1')
  })
})
