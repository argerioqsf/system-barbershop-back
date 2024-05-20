import { Leads, Prisma } from '@prisma/client'

export interface LeadsRepository {
  create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads>
  findMany(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
  ): Promise<Leads[]>
  count(query?: string): Promise<number>
  findById(id: string): Promise<Leads | null>
  updateById(id: string, data: Prisma.LeadsUpdateInput): Promise<Leads>
  findManyArchived(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
  ): Promise<Leads[]>
}
