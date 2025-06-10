import { prisma } from '@/lib/prisma'
import { Prisma, Unit } from '@prisma/client'
import { UnitRepository } from '../unit-repository'

export class PrismaUnitRepository implements UnitRepository {
  async create(data: Prisma.UnitCreateInput): Promise<Unit> {
    return prisma.unit.create({ data })
  }

  async findById(id: string): Promise<Unit | null> {
    return prisma.unit.findUnique({ where: { id } })
  }

  async findManyByOrganization(organizationId: string): Promise<Unit[]> {
    return prisma.unit.findMany({ where: { organizationId } })
  }
}
