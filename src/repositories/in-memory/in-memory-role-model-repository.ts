import { Prisma, RoleModel } from '@prisma/client'
import { randomUUID } from 'crypto'
import { RoleModelRepository } from '../role-model-repository'

export class InMemoryRoleModelRepository implements RoleModelRepository {
  constructor(public roles: RoleModel[] = []) {}

  async create(data: Prisma.RoleModelCreateInput): Promise<RoleModel> {
    const role: RoleModel = {
      id: randomUUID(),
      name: data.name as string,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.roles.push(role)
    return role
  }

  async findMany(where: Prisma.RoleModelWhereInput = {}): Promise<RoleModel[]> {
    return this.roles.filter((r) => {
      if (where.unitId && r.unitId !== where.unitId) return false
      return true
    })
  }

  async findById(id: string): Promise<RoleModel | null> {
    return this.roles.find((r) => r.id === id) ?? null
  }
}
