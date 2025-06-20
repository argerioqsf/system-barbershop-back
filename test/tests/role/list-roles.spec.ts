import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListRolesService } from '../../../src/services/role/list-roles'
import { InMemoryRoleModelRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeRoleModel, makeProfile } from '../../helpers/default-values'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'

const profileRepo = new FakeProfilesRepository()

vi.mock('../../../src/services/@factories/profile/get-profile-from-userId-service', () => ({
  getProfileFromUserIdService: () => new GetUserProfileFromUserIdService(profileRepo),
}))

const r1 = makeRoleModel('r1', 'unit-1')
const r2 = makeRoleModel('r2', 'unit-2')

describe('List roles service', () => {
  let repo: InMemoryRoleModelRepository
  let service: ListRolesService

  beforeEach(() => {
    repo = new InMemoryRoleModelRepository([r1, r2])
    service = new ListRolesService(repo)
    const profile = makeProfile('prof-1', '1')
    ;(profile as any).permissions = [{ id: 'perm', name: 'LIST_ROLES' }]
    profileRepo.profiles = [profile]
  })

  it('lists roles from user unit', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.roles).toHaveLength(1)
    expect(res.roles[0].id).toBe('r1')
  })
})
