import { Prisma, Role } from '@prisma/client'

export interface RoleRepository {
  create(data: Prisma.RoleCreateInput): Promise<Role>
  findMany(where?: Prisma.RoleWhereInput): Promise<Role[]>
  findById(id: string): Promise<Role | null>
}
