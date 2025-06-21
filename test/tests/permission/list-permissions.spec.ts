import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListPermissionsService } from '../../../src/services/permission/list-permissions'
import {
  InMemoryPermissionRepository,
  FakeProfilesRepository,
} from '../../helpers/fake-repositories'
import { makePermission, makeProfile } from '../../helpers/default-values'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'

const profileRepo = new FakeProfilesRepository()

vi.mock(
  '../../../src/services/@factories/profile/get-profile-from-userId-service',
  () => ({
    getProfileFromUserIdService: () =>
      new GetUserProfileFromUserIdService(profileRepo),
  }),
)

const p1 = makePermission('p1')
const p2 = makePermission('p2')

describe('List permissions service', () => {
  let repo: InMemoryPermissionRepository
  let service: ListPermissionsService

  beforeEach(() => {
    repo = new InMemoryPermissionRepository([p1, p2])
    service = new ListPermissionsService(repo)
    const profile = makeProfile('prof-1', '1')
    ;(profile as any).permissions = [
      { id: 'perm', name: 'LIST_PERMISSIONS_ALL' },
    ]
    profileRepo.profiles = [profile]
  })

  it('lists all permissions', async () => {
    const res = await service.execute({
      sub: '1',
      permissions: ['LIST_PERMISSIONS_ALL'],
      organizationId: 'org-1',
    } as any)
    expect(res.permissions).toHaveLength(2)
    expect(res.permissions.map((p) => p.id)).toContain('p1')
  })
})
