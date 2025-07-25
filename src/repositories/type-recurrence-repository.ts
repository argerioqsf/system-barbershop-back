import { Prisma, TypeRecurrence } from '@prisma/client'

export interface TypeRecurrenceRepository {
  create(data: Prisma.TypeRecurrenceCreateInput): Promise<TypeRecurrence>
  update(
    id: string,
    data: Prisma.TypeRecurrenceUpdateInput,
  ): Promise<TypeRecurrence>
  findById(id: string): Promise<TypeRecurrence | null>
  findMany(where?: Prisma.TypeRecurrenceWhereInput): Promise<TypeRecurrence[]>
  delete(id: string): Promise<void>
}
