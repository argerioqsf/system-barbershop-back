import { describe, it, expect, beforeEach } from 'vitest'
import { CreatePermissionService } from '../../../src/services/permission/create-permission'
import { InMemoryPermissionRepository } from '../../helpers/fake-repositories'

describe('Create permission service', () => {
  let repo: InMemoryPermissionRepository
  let service: CreatePermissionService

  beforeEach(() => {
    repo = new InMemoryPermissionRepository([])
    service = new CreatePermissionService(repo)
  })

  it('creates a permission', async () => {
    const res = await service.execute({
      name: 'Permission',
      featureIds: ['f1', 'f2'],
      unitId: 'unit-1',
    })
    expect(repo.permissions).toHaveLength(1)
    expect(res.permission.name).toBe('Permission')
    expect(res.permission.unitId).toBe('unit-1')
  })
})
