import { Prisma, Permission } from '@prisma/client'

export interface PermissionRepository {
  create(data: Prisma.PermissionCreateInput): Promise<Permission>
  findMany(where?: Prisma.PermissionWhereInput): Promise<Permission[]>
  findManyByRole(roleModelId: string): Promise<Permission[]>
  findManyByIds(ids: string[]): Promise<Permission[]>
}
