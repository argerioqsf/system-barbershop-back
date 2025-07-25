import { Prisma, Benefit } from '@prisma/client'

export interface BenefitRepository {
  create(data: Prisma.BenefitCreateInput): Promise<Benefit>
  update(id: string, data: Prisma.BenefitUpdateInput): Promise<Benefit>
  findById(id: string): Promise<Benefit | null>
  findMany(where?: Prisma.BenefitWhereInput): Promise<Benefit[]>
  delete(id: string): Promise<void>
}
