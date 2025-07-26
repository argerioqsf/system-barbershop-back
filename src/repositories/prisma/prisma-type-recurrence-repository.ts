import { prisma } from '@/lib/prisma'
import { Prisma, TypeRecurrence } from '@prisma/client'
import { TypeRecurrenceRepository } from '../type-recurrence-repository'

export class PrismaTypeRecurrenceRepository
  implements TypeRecurrenceRepository
{
  create(data: Prisma.TypeRecurrenceCreateInput): Promise<TypeRecurrence> {
    return prisma.typeRecurrence.create({ data })
  }

  update(
    id: string,
    data: Prisma.TypeRecurrenceUpdateInput,
  ): Promise<TypeRecurrence> {
    return prisma.typeRecurrence.update({ where: { id }, data })
  }

  findById(id: string): Promise<TypeRecurrence | null> {
    return prisma.typeRecurrence.findUnique({ where: { id } })
  }

  findMany(
    where: Prisma.TypeRecurrenceWhereInput = {},
  ): Promise<TypeRecurrence[]> {
    return prisma.typeRecurrence.findMany({ where })
  }

  async delete(id: string): Promise<void> {
    await prisma.typeRecurrence.delete({ where: { id } })
  }
}
