import { Prisma, Debt } from '@prisma/client'

export interface DebtRepository {
  create(data: Prisma.DebtUncheckedCreateInput): Promise<Debt>
  update(
    id: string,
    data: Prisma.DebtUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Debt>
  findById(id: string): Promise<Debt | null>
  findMany(where?: Prisma.DebtWhereInput): Promise<Debt[]>
  findManyPaginated(
    where: Prisma.DebtWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Debt[]; count: number }>
  delete(id: string): Promise<void>
}
