import { describe, it, expect, beforeEach } from 'vitest'
import { UpdatePermissionService } from '../../../src/services/permission/update-permission'
import { InMemoryPermissionRepository } from '../../helpers/fake-repositories'
import { PermissionCategory, PermissionName } from '@prisma/client'

const perm = {
  id: 'perm-1',
  name: PermissionName.LIST_USER_ALL,
  category: PermissionCategory.USER,
}

describe('Update permission service', () => {
  let repo: InMemoryPermissionRepository
  let service: UpdatePermissionService

  beforeEach(() => {
    repo = new InMemoryPermissionRepository([perm])
    service = new UpdatePermissionService(repo)
  })

  it('updates permission data', async () => {
    const res = await service.execute({
      id: 'perm-1',
      name: PermissionName.LIST_ROLES_UNIT,
    })
    expect(res.permission.name).toBe(PermissionName.LIST_ROLES_UNIT)
    expect(repo.permissions[0].name).toBe(PermissionName.LIST_ROLES_UNIT)
  })
})
