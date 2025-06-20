import { prisma } from '@/lib/prisma'
import { Prisma, Permission } from '@prisma/client'
import { PermissionRepository } from '../permission-repository'

export class PrismaPermissionRepository implements PermissionRepository {
  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    return prisma.permission.create({ data })
  }

  async findMany(
    where: Prisma.PermissionWhereInput = {},
  ): Promise<Permission[]> {
    return prisma.permission.findMany({ where, include: { features: true } })
  }

  async findManyByRole(roleId: string): Promise<Permission[]> {
    return prisma.permission.findMany({
      where: { roles: { some: { id: roleId } } },
    })
  }

  async findManyByIds(ids: string[]): Promise<Permission[]> {
    return prisma.permission.findMany({ where: { id: { in: ids } } })
  }
}
