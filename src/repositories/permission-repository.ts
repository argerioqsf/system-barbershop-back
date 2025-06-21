import { Prisma, Permission } from '@prisma/client'

export interface PermissionRepository {
  create(data: Prisma.PermissionCreateInput): Promise<Permission>
  findMany(where?: Prisma.PermissionWhereInput): Promise<Permission[]>
  findManyByRole(roleId: string): Promise<Permission[]>
  findManyByIds(ids: string[]): Promise<Permission[]>
  update(id: string, data: Prisma.PermissionUpdateInput): Promise<Permission>
}
