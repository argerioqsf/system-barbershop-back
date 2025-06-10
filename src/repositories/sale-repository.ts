import { Prisma, Sale } from '@prisma/client'

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<Sale>
  findMany(where?: Prisma.SaleWhereInput): Promise<Sale[]>
  findById(id: string): Promise<Sale | null>
  findManyByDateRange(start: Date, end: Date): Promise<Sale[]>
  findManyByUser(userId: string): Promise<Sale[]>
}
