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
      name: 'LIST_APPOINTMENTS_UNIT',
      category: 'UINIT',
    })
    expect(repo.permissions).toHaveLength(1)
    expect(res.permission.name).toBe('LIST_APPOINTMENTS_UNIT')
  })
})
