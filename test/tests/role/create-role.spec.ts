import { describe, it, expect, beforeEach } from 'vitest'
import { CreateRoleService } from '../../../src/services/role/create-role'
import { InMemoryRoleModelRepository } from '../../helpers/fake-repositories'

describe('Create role service', () => {
  let repo: InMemoryRoleModelRepository
  let service: CreateRoleService

  beforeEach(() => {
    repo = new InMemoryRoleModelRepository([])
    service = new CreateRoleService(repo)
  })

  it('creates a role', async () => {
    const res = await service.execute({
      name: 'Manager',
      unitId: 'unit-1',
      permissionIds: ['p1', 'p2'],
    })
    expect(repo.roles).toHaveLength(1)
    expect(res.role.name).toBe('Manager')
    expect(res.role.unitId).toBe('unit-1')
  })
})
