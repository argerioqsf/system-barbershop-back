import { Prisma, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  findById(id: string, tx?: Prisma.TransactionClient): Promise<Unit | null>
  findManyByOrganization(organizationId: string): Promise<Unit[]>
  findMany(where?: Prisma.UnitWhereInput): Promise<Unit[]>
  update(
    id: string,
    data: Prisma.UnitUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Unit>
  delete(id: string): Promise<void>
  incrementBalance(
    id: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void>
}
