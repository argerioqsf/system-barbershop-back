import {
  Prisma,
  Permission,
  PermissionName,
  PermissionCategory,
} from '@prisma/client'
    if (data.category) permission.category = data.category as PermissionCategory
  Permission,
  PermissionName,
  PermissionCategory,
} from '@prisma/client'
import { randomUUID } from 'crypto'
import { PermissionRepository } from '../permission-repository'

export class InMemoryPermissionRepository implements PermissionRepository {
  constructor(
    public permissions: (Permission & { roles?: { id: string }[] })[] = [],
  ) {}

  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    const permission: Permission = {
      category: 'UNIT',
      id: randomUUID(),
      name: data.name as PermissionName,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.permissions.push(permission)
    return permission
  }

  async findMany(
    where: Prisma.PermissionWhereInput = {},
  ): Promise<Permission[]> {
    return this.permissions.filter((p) => {
      if (where.unitId && p.unitId !== where.unitId) return false
      return true
    })
  }

  async findManyByRole(roleId: string): Promise<Permission[]> {
    return this.permissions.filter((p) => p.roles?.some((r) => r.id === roleId))
  }

  async findManyByIds(ids: string[]): Promise<Permission[]> {
    return this.permissions.filter((p) => ids.includes(p.id))
  }

  async update(
    id: string,
    data: Prisma.PermissionUpdateInput,
  ): Promise<Permission> {
    const permission = this.permissions.find((p) => p.id === id)
    if (!permission) throw new Error('Permission not found')
    if (data.name) permission.name = data.name as PermissionName
    if (data.category) permission.category = data.category as PermissionCategory
    return permission
  }
}
