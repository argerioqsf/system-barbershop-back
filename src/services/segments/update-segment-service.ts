import { CourseSegmentRepository } from '@/repositories/course-segment-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { Prisma, Segment } from '@prisma/client'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'
import { CoursesRepository } from '@/repositories/course-repository'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface UpdateSegmentServiceRequest {
  id: string
  name: string
  coursesIds?: string[]
}

interface UpdateSegmentServiceResponse {
  segment: Segment
  courseSegment: Prisma.BatchPayload
}

export class UpdateSegmentService {
  constructor(
    private segmentRepository: SegmentsRepository,
    private coursesRepository: CoursesRepository,
    private coursesSegmentRepository: CourseSegmentRepository,
  ) {}

  async execute({
    id,
    name,
    coursesIds,
  }: UpdateSegmentServiceRequest): Promise<UpdateSegmentServiceResponse> {
    const segment = await this.segmentRepository.findById(id)

    if (!segment) throw new SegmentNotFoundError()

    const courses = coursesIds
      ? await this.coursesRepository.findManyListIds(coursesIds)
      : []

    if (coursesIds && courses.length !== coursesIds.length) {
      throw new CourseNotFoundError()
    }

    const addCoursesIds = coursesIds?.filter((id) => {
      const existCourse = segment.courses.filter(
        (course) => course.course.id === id,
      )
      if (existCourse?.length > 0) return false
      return true
    })

    const removeCoursesIds = segment.courses
      .filter((course) => {
        const existCourse = coursesIds?.filter((id) => course.course.id === id)
        if (existCourse && existCourse?.length > 0) return false
        return true
      })
      .map((course) => course.course.id)

    const segmentUpdate = await this.segmentRepository.updateById(id, { name })

    if (removeCoursesIds.length > 0) {
      await this.coursesSegmentRepository.deleteMany(
        segment.id,
        removeCoursesIds,
      )
    }

    const courseSegment = await this.coursesSegmentRepository.createMany(
      segment.id,
      addCoursesIds,
    )

    return { segment: segmentUpdate, courseSegment }
  }
}
