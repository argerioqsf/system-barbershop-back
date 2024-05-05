import { UnitCourseRepository } from '@/repositories/unit-course-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitSegmentRepository } from '@/repositories/unit-segment-repository'
import { Prisma, Unit } from '@prisma/client'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

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

    const unitUpdate = await this.unitRepository.updateById(id, { name })

    const unitCourse = await this.unitCourseRepository.createMany(
      unit.id,
      coursesIds,
    )

    const unitSegment = await this.unitSegmentRepository.createMany(
      unit.id,
      segmentsIds,
    )

    return { unit: unitUpdate, unitCourse, unitSegment }
  }
}
