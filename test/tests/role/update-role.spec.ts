import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateRoleService } from '../../../src/services/role/update-role'
import { InMemoryRoleRepository } from '../../helpers/fake-repositories'
import { RoleName } from '@prisma/client'

const role = {
  id: 'r1',
  name: RoleName.OWNER,
  unitId: 'unit-1',
}

describe('Update role service', () => {
  let repo: InMemoryRoleRepository
  let service: UpdateRoleService

  beforeEach(() => {
    repo = new InMemoryRoleRepository([role])
    service = new UpdateRoleService(repo)
  })

  it('updates role data', async () => {
    const res = await service.execute({ id: 'r1', name: RoleName.MANAGER })
    expect(res.role.name).toBe(RoleName.MANAGER)
    expect(repo.roles[0].name).toBe(RoleName.MANAGER)
  })
})
