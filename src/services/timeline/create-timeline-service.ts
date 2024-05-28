import { LeadsRepository } from '@/repositories/leads-repository'
import { TimelineRepository } from '@/repositories/timeline-repository'
import { Timeline } from '@prisma/client'
import { LeadsNotFoundError } from '../@errors/leads-not-found-error'

interface CreateTimelineServiceRequest {
  title: string
  description: string
  status: string
  leadsId: string
}

interface CreateTimelineServiceResponse {
  timeline: Timeline
}

export class CreateTimelineService {
  constructor(
    private timelineRepository: TimelineRepository,
    private leadsRepository: LeadsRepository,
  ) {}

  async execute({
    title,
    description,
    status,
    leadsId,
  }: CreateTimelineServiceRequest): Promise<CreateTimelineServiceResponse> {
    const lead = await this.leadsRepository.findById(leadsId)

    if (!lead) throw new LeadsNotFoundError()

    const timeline = await this.timelineRepository.create({
      title,
      description,
      status,
      leadsId: lead.id,
      courseId: lead.courseId,
      unitId: lead.unitId,
      segmentId: lead.segmentId,
    })

    return { timeline }
  }
}
