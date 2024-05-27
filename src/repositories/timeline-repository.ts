import { Leads, Prisma, Timeline } from '@prisma/client'

export interface TimelineRepository {
  create(data: Prisma.TimelineUncheckedCreateInput): Promise<Timeline>
}
