import { CoursesRepository } from "@/repositories/course-repository";
import { course } from "@prisma/client";
import { CourseNotFoundError } from "./errors/course-not-found-error";

interface GetCoursesServiceResponse {
  courses: course[];
}

export class GetCoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async execute(): Promise<GetCoursesServiceResponse> {
    const courses = await this.coursesRepository.findMany();

    if (!courses) {
      throw new CourseNotFoundError();
    }

    return { courses };
  }
}
