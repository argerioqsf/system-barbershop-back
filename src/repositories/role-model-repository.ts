import { Prisma, RoleModel } from '@prisma/client'

export interface RoleModelRepository {
  create(data: Prisma.RoleModelCreateInput): Promise<RoleModel>
  findById(id: string): Promise<RoleModel | null>
}
