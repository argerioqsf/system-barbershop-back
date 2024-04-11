import { prisma } from '@/lib/prisma'
import { Course, Prisma } from '@prisma/client'
import { CoursesRepository } from '../course-repository'

export class PrismaCoursesRepository implements CoursesRepository {
  async searchMany(query: string, page: number) {
    const courses = await prisma.course.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: 10,
      skip: (page - 1) * 10,
    })

    return courses
  }

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

  async findMany(page: number): Promise<Course[]> {
    const courses = await prisma.course.findMany({
      take: 10,
      skip: (page - 1) * 10,
    })

    return courses
  }

  async findById(id: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({ where: { id } })

    return course
  }
}
