import { CoursesRepository } from "@/repositories/course-repository";
import { UnitCourseRepository } from "@/repositories/unit-course-repository";
import { UnitRepository } from "@/repositories/unit-repository";
import { UnitCourses } from "@prisma/client";

interface CreateUnitCourseServiceRequest {
  unitId: string;
  courseId: string;
}

interface CreateUnitCourseServiceResponse {
  unitCourses: UnitCourses;
}

export class CreateUnitCourseService {
  constructor(
    private coursesUnitRepository: UnitCourseRepository,
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository
  ) {}

  async execute({ unitId, courseId }: CreateUnitCourseServiceRequest): Promise<CreateUnitCourseServiceResponse> {
    const unit = await this.unitRepository.findById(unitId)
    const course = await this.coursesRepository.findById(courseId)

    if (!unit) {
      throw new Error('unit not found')
    }

    if (!course) {
      throw new Error('courses not found')
    }

    const unitCourses = await this.coursesUnitRepository.create({
      unitId,
      courseId,
    });

    return { unitCourses };
  }
}
