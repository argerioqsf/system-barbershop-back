import { describe, it, expect, beforeEach } from 'vitest'
import { ListPermissionsService } from '../../../src/services/permission/list-permissions'
import { InMemoryPermissionRepository } from '../../helpers/fake-repositories'
import { makePermission } from '../../helpers/default-values'

const p1 = makePermission('p1', 'unit-1')
const p2 = makePermission('p2', 'unit-2')

describe('List permissions service', () => {
  let repo: InMemoryPermissionRepository
  let service: ListPermissionsService

  beforeEach(() => {
    repo = new InMemoryPermissionRepository([p1, p2])
    service = new ListPermissionsService(repo)
  })

  it('lists permissions from user unit', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'MANAGER',
      unitId: 'unit-1',
      organizationId: 'org-1',
      permissions: ['LIST_PERMISSIONS'],
    } as any)
    expect(res.permissions).toHaveLength(1)
    expect(res.permissions[0].id).toBe('p1')
  })
})
