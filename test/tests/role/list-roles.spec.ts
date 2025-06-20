import { describe, it, expect, beforeEach } from 'vitest'
import { ListRolesService } from '../../../src/services/role/list-roles'
import { InMemoryRoleModelRepository } from '../../helpers/fake-repositories'
import { makeRoleModel } from '../../helpers/default-values'

const r1 = makeRoleModel('r1', 'unit-1')
const r2 = makeRoleModel('r2', 'unit-2')

describe('List roles service', () => {
  let repo: InMemoryRoleModelRepository
  let service: ListRolesService

  beforeEach(() => {
    repo = new InMemoryRoleModelRepository([r1, r2])
    service = new ListRolesService(repo)
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
