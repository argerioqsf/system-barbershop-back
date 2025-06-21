import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListRolesService } from '../../../src/services/role/list-roles'
import { InMemoryRoleRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeRole, makeProfile } from '../../helpers/default-values'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'

const profileRepo = new FakeProfilesRepository()

vi.mock('../../../src/services/@factories/profile/get-profile-from-userId-service', () => ({
  getProfileFromUserIdService: () => new GetUserProfileFromUserIdService(profileRepo),
}))

const r1 = makeRole('r1', 'unit-1')
const r2 = makeRole('r2', 'unit-2')

describe('List roles service', () => {
  let repo: InMemoryRoleRepository
  let service: ListRolesService

  beforeEach(() => {
    repo = new InMemoryRoleRepository([r1, r2])
    service = new ListRolesService(repo)
    const profile = makeProfile('prof-1', '1')
    ;(profile as any).permissions = [{ id: 'perm', name: 'LIST_ROLES_UNIT' }]
    profileRepo.profiles = [profile]
  })

  it('lists roles from user unit', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
      permissions: ['LIST_ROLES_UNIT'],
    } as any)
    expect(res.roles).toHaveLength(1)
    expect(res.roles[0].id).toBe('r1')
  })
})
