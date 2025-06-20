import { prisma } from '@/lib/prisma'
import { Prisma, Role } from '@prisma/client'
import { RoleRepository } from '../role-repository'

export class PrismaRoleRepository implements RoleRepository {
  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    return prisma.role.create({ data })
  }

  async findMany(where: Prisma.RoleWhereInput = {}): Promise<Role[]> {
    return prisma.role.findMany({
      where,
      include: { permissions: true },
    })
  }

  async findById(id: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { id } })
  }
}
