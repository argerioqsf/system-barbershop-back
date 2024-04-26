import { Leads, Prisma } from '@prisma/client'

export interface LeadsRepository {
  create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads>
  findMany(page: number, query?: string): Promise<Leads[]>
  count(query?: string): Promise<number>
  findById(id: string): Promise<Leads | null>
}
