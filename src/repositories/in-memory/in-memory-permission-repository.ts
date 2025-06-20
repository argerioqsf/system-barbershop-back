import { Prisma, Permission } from '@prisma/client'
import { randomUUID } from 'crypto'
import { PermissionRepository } from '../permission-repository'

export class InMemoryPermissionRepository implements PermissionRepository {
  constructor(
    public permissions: (Permission & { roles?: { id: string }[] })[] = [],
  ) {}

  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    const permission: Permission = {
      id: randomUUID(),
      name: data.name as string,
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
}
