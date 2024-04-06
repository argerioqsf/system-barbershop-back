import { Prisma, Course, Unit } from '@prisma/client'
import { CoursesRepository } from '../course-repository'
import { prisma } from '@/lib/prisma'

export class PrismaCoursesRepository implements CoursesRepository {
  async findManyListIds(ids: string[]): Promise<Course[]> {
    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return courses
  }

  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    const course = await prisma.course.create({ data })

    return course
  }

  async findMany(): Promise<Course[]> {
    const courses = await prisma.course.findMany()

    return courses
  }

  async findById(id: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({ where: { id } })

    return course
  }
}
