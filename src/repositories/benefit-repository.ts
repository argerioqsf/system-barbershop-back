import { Prisma, Benefit } from '@prisma/client'

export interface BenefitRepository {
  create(data: Prisma.BenefitCreateInput): Promise<Benefit>
  update(
    id: string,
    data: Prisma.BenefitUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Benefit>
  findById(id: string): Promise<Benefit | null>
  findMany(where?: Prisma.BenefitWhereInput): Promise<Benefit[]>
  findManyPaginated(
    where: Prisma.BenefitWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Benefit[]; count: number }>
  delete(id: string): Promise<void>
}
