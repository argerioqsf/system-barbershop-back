import { Prisma, Permission } from '@prisma/client'
import { randomUUID } from 'crypto'
import { PermissionRepository } from '../permission-repository'

export class InMemoryPermissionRepository implements PermissionRepository {
  constructor(public permissions: Permission[] = []) {}

  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    const permission: Permission = {
      id: randomUUID(),
      action: data.action as string,
      category: data.category as string,
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

  async findManyByRole(roleModelId: string): Promise<Permission[]> {
    return this.permissions.filter((p) =>
      (p as any).roles?.some((r: any) => r.id === roleModelId),
    )
  }

  async findManyByIds(ids: string[]): Promise<Permission[]> {
    return this.permissions.filter((p) => ids.includes(p.id))
  }
}
