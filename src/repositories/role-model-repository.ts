import { Prisma, RoleModel } from '@prisma/client'

export interface RoleModelRepository {
  create(data: Prisma.RoleModelCreateInput): Promise<RoleModel>
  findMany(where?: Prisma.RoleModelWhereInput): Promise<RoleModel[]>
  findById(id: string): Promise<RoleModel | null>
}
