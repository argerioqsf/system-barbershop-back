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
  delete(id: string): Promise<void>
}
