import { CoursesRepository } from '@/repositories/course-repository'
import { LeadsRepository } from '@/repositories/leads-repository'
import { TimelineRepository } from '@/repositories/timeline-repository'
import { Timeline } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { LeadsNotFoundError } from '../@errors/leads-not-found-error'

interface CreateTimelineServiceRequest {
  title: string
  description: string
  status: string
  leadsId: string
  courseId: string
}

interface CreateTimelineServiceResponse {
  timeline: Timeline
}

export class CreateTimelineService {
  constructor(
    private timelineRepository: TimelineRepository,
    private courseRepository: CoursesRepository,
    private leadsRepository: LeadsRepository,
  ) {}

  async execute({
    title,
    description,
    status,
    leadsId,
    courseId,
  }: CreateTimelineServiceRequest): Promise<CreateTimelineServiceResponse> {
    const course = await this.courseRepository.findById(courseId)
    const lead = await this.leadsRepository.findById(leadsId)

    if (!course) throw new CourseNotFoundError()

    if (!lead) throw new LeadsNotFoundError()

    const timeline = await this.timelineRepository.create({
      title,
      description,
      status,
      leadsId: lead.id,
      courseId,
    })

    return { timeline }
  }
}
