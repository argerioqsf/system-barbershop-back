import { CoursesRepository } from '@/repositories/course-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { UnitCourseRepository } from '@/repositories/unit-course-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitSegmentRepository } from '@/repositories/unit-segment-repository'
import { Prisma, Unit } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface CreateUnitServiceRequest {
  name: string
  coursesIds?: string[]
  segmentsIds?: string[]
}

interface CreateUnitServiceResponse {
  unit: Unit
  unitCourses: Prisma.BatchPayload
  unitSegments: Prisma.BatchPayload
}

export class CreateUnitService {
  constructor(
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository,
    private segmentRepository: SegmentsRepository,
    private unitCourseRepository: UnitCourseRepository,
    private segmentCourseRepository: UnitSegmentRepository,
  ) {}

  async execute({
    name,
    coursesIds,
    segmentsIds,
  }: CreateUnitServiceRequest): Promise<CreateUnitServiceResponse> {
    const courses = coursesIds
      ? await this.coursesRepository.findManyListIds(coursesIds)
      : []

    const segments = segmentsIds
      ? await this.segmentRepository.findManyListIds(segmentsIds)
      : []

    if (coursesIds && courses.length !== coursesIds.length) {
      throw new CourseNotFoundError()
    }

    if (segmentsIds && segments.length !== segmentsIds.length) {
      throw new SegmentNotFoundError()
    }

    const unit = await this.unitRepository.create({
      name,
    })

    const unitCourses = await this.unitCourseRepository.createMany(
      unit.id,
      coursesIds,
    )

    const unitSegments = await this.segmentCourseRepository.createMany(
      unit.id,
      segmentsIds,
    )

    return { unit, unitCourses, unitSegments }
  }
}
