import { Prisma, Role, RoleName } from '@prisma/client'
import { randomUUID } from 'crypto'
import { RoleRepository } from '../role-repository'

export class InMemoryRoleRepository implements RoleRepository {
  constructor(public roles: Role[] = []) {}

  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    const role: Role = {
      id: randomUUID(),
      name: data.name as RoleName,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.roles.push(role)
    return role
  }

  async findMany(where: Prisma.RoleWhereInput = {}): Promise<Role[]> {
    return this.roles.filter((r) => {
      if (where.unitId && r.unitId !== where.unitId) return false
      return true
    })
  }

  async findById(id: string): Promise<Role | null> {
    return this.roles.find((r) => r.id === id) ?? null
  }

  async update(id: string, data: Prisma.RoleUpdateInput): Promise<Role> {
    const role = this.roles.find((r) => r.id === id)
    if (!role) throw new Error('Role not found')
    if (data.name) role.name = data.name as RoleName
    return role
  }
}
