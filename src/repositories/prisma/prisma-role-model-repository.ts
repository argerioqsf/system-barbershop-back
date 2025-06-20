import { prisma } from '@/lib/prisma'
import { Prisma, RoleModel } from '@prisma/client'
import { RoleModelRepository } from '../role-model-repository'

export class PrismaRoleModelRepository implements RoleModelRepository {
  async create(data: Prisma.RoleModelCreateInput): Promise<RoleModel> {
    return prisma.roleModel.create({ data })
  }

  async findMany(where: Prisma.RoleModelWhereInput = {}): Promise<RoleModel[]> {
    return prisma.roleModel.findMany({ where })
  }

  async findById(id: string): Promise<RoleModel | null> {
    return prisma.roleModel.findUnique({ where: { id } })
  }
}
