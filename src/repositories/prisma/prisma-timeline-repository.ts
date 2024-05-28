import { prisma } from '@/lib/prisma'
import { Prisma, Timeline } from '@prisma/client'
import { TimelineRepository } from '../timeline-repository'

export class PrismaTimelineRepository implements TimelineRepository {
  async create(data: Prisma.TimelineUncheckedCreateInput): Promise<Timeline> {
    const timeline = await prisma.timeline.create({ data })

    return timeline
  }
}
