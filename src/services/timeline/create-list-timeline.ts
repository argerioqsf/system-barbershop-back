import { CoursesRepository } from '@/repositories/course-repository'
import { LeadsRepository } from '@/repositories/leads-repository'
import { TimelineRepository } from '@/repositories/timeline-repository'
import { Timeline } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { LeadsNotFoundError } from '../@errors/leads-not-found-error'

interface CreateListTimelinesServiceRequest {
  timelines: {
    title: string
    description: string
    status: string
    leadsId: string
    courseId: string
  }[]
}

interface CreateListTimelinesServiceResponse {
  timeline: Timeline[]
}

// export class CreateListTimelinesService {
//   constructor(
//     private timelineRepository: TimelineRepository,
//     private courseRepository: CoursesRepository,
//     private leadsRepository: LeadsRepository
//   ) {}

//   async execute({
//     timelines
//   }: CreateListTimelinesServiceRequest): Promise<CreateListTimelinesServiceResponse> {
//     const course = await this.courseRepository.findById(courseId);
//     const lead = await this.leadsRepository.findById(leadsId);

//     const timeline = await this.timelineRepository.create({

//     });

//     return { timeline };
//   }
// }
