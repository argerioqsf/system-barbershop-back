import { Leads, Prisma, Timeline } from '@prisma/client'
import { TimelineRepository } from '../timeline-repository'
import { prisma } from '@/lib/prisma'

export class PrismaTimelineRepository implements TimelineRepository {
  async create(data: Prisma.TimelineUncheckedCreateInput): Promise<Timeline> {
    const timeline = await prisma.timeline.create({ data })

    return timeline
  }
}
