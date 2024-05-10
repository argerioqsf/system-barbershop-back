import { UnitCourseRepository } from '@/repositories/unit-course-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitSegmentRepository } from '@/repositories/unit-segment-repository'
import { Prisma, Unit } from '@prisma/client'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'
import { CoursesRepository } from '@/repositories/course-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface UpdateUnitServiceRequest {
  id: string
  name: string
  coursesIds?: string[]
  segmentsIds?: string[]
}

interface UpdateUnitServiceResponse {
  unit: Unit
  unitCourse: Prisma.BatchPayload
  unitSegment: Prisma.BatchPayload
}

export class UpdateUnitService {
  constructor(
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository,
    private segmentRepository: SegmentsRepository,
    private unitCourseRepository: UnitCourseRepository,
    private unitSegmentRepository: UnitSegmentRepository,
  ) {}

  async execute({
    id,
    name,
    coursesIds,
    segmentsIds,
  }: UpdateUnitServiceRequest): Promise<UpdateUnitServiceResponse> {
    const unit = await this.unitRepository.findById(id)

    if (!unit) throw new UnitNotFoundError()

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

    const addCoursesIds = coursesIds?.filter((id) => {
      const existCourse = unit.courses.filter(
        (course) => course.course.id === id,
      )
      if (existCourse?.length > 0) return false
      return true
    })

    const removeCoursesIds = unit.courses
      .filter((course) => {
        const existCourse = coursesIds?.filter((id) => course.course.id === id)
        if (existCourse && existCourse?.length > 0) return false
        return true
      })
      .map((course) => course.course.id)

    const addSegmentsIds = segmentsIds?.filter((id) => {
      const existCourse = unit.segments.filter(
        (segment) => segment.segment.id === id,
      )
      if (existCourse?.length > 0) return false
      return true
    })

    const removeSegmentsIds = unit.segments
      .filter((segment) => {
        const existCourse = segmentsIds?.filter(
          (id) => segment.segment.id === id,
        )
        if (existCourse && existCourse?.length > 0) return false
        return true
      })
      .map((segment) => segment.segment.id)

    const unitUpdate = await this.unitRepository.updateById(id, { name })

    if (removeCoursesIds.length > 0) {
      await this.unitCourseRepository.deleteMany(unit.id, removeCoursesIds)
    }

    if (removeSegmentsIds.length > 0) {
      await this.unitSegmentRepository.deleteMany(unit.id, removeSegmentsIds)
    }

    const unitCourse = await this.unitCourseRepository.createMany(
      unit.id,
      addCoursesIds,
    )

    const unitSegment = await this.unitSegmentRepository.createMany(
      unit.id,
      addSegmentsIds,
    )

    return { unit: unitUpdate, unitCourse, unitSegment }
  }
}
