import { TimelineRepository } from '@/repositories/timeline-repository'
import { Timeline } from '@prisma/client'
import { TimelineNotFoundError } from '../@errors/timeline-not-found'

interface GetTimelineServiceRequest {
  id: string
}

interface GetLeadServiceResponse {
  timeline: Timeline
}

export class GetTimelineService {
  constructor(private timelineRepository: TimelineRepository) {}

  async execute({
    id,
  }: GetTimelineServiceRequest): Promise<GetLeadServiceResponse> {
    const timeline = await this.timelineRepository.findById(id)

    if (!timeline) throw new TimelineNotFoundError()

    return { timeline }
  }
}
