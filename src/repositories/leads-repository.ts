import { Leads, Prisma } from '@prisma/client'

export interface LeadsRepository {
  create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads>
  findMany(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
    unitsId?: string[],
  ): Promise<Leads[]>
  count(query?: string, unitsId?: string[]): Promise<number>
  findById(id: string): Promise<Leads | null>
  updateById(id: string, data: Prisma.LeadsUncheckedUpdateInput): Promise<Leads>
  findManyArchived(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
  ): Promise<Leads[]>
}
