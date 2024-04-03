import { CoursesRepository } from '@/repositories/course-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface CreateUnitServiceRequest {
  name: string
  courseId: string
}

interface CreateUnitServiceResponse {
  unit: Unit
}

export class CreateUnitService {
  constructor(
    private unitRepository: UnitRepository,
    private courseRepository: CoursesRepository,
  ) {}

  async execute({
    name,
    courseId,
  }: CreateUnitServiceRequest): Promise<CreateUnitServiceResponse> {
    const unit = await this.unitRepository.create({
      name,
    })
    await this.courseRepository.addUnitCourseId(courseId, unit)

    return { unit }
  }
}
