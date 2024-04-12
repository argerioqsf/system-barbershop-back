import { Leads, Prisma } from '@prisma/client'

export interface LeadsRepository {
  create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads>
}
