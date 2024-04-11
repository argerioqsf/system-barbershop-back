import { prisma } from '@/lib/prisma'
import { Course, Prisma } from '@prisma/client'
import { CoursesRepository } from '../course-repository'
import { pagination } from '@/utils/constants/pagination'

export class PrismaCoursesRepository implements CoursesRepository {
  async findManyListIds(ids: string[]): Promise<Course[]> {
    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return courses
  }

  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    const course = await prisma.course.create({ data })

    return course
  }

  async findMany(page: number, query?: string): Promise<Course[]> {
    const courses = await prisma.course.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return courses
  }

  async findById(id: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({ where: { id } })

    return course
  }
}
