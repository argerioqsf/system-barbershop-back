import { prisma } from '@/lib/prisma'
import { Course, Prisma } from '@prisma/client'
import { CoursesRepository } from '../course-repository'
import { pagination } from '@/utils/constants/pagination'

export class PrismaCoursesRepository implements CoursesRepository {
  async updateById(
    id: string,
    data: Prisma.CourseUpdateInput,
  ): Promise<Course> {
    const course = await prisma.course.update({
      where: { id },
      data,
    })

    return course
  }

  async deleteById(id: string): Promise<Course | null> {
    const course = await prisma.course.delete({
      where: { id },
    })

    return course
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

  async findMany(
    page: number,
    where: Prisma.CourseWhereInput,
  ): Promise<Course[]> {
    const courses = await prisma.course.findMany({
      where: {
        ...where,
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return courses
  }

  async count(where: Prisma.CourseWhereInput): Promise<number> {
    const courses = await prisma.course.count({
      where: {
        ...where,
      },
    })

    return courses
  }

  async mountSelect(): Promise<Omit<Course, 'active'>[]> {
    const courses = await prisma.course.findMany({
      where: {
        active: true,
      },
      select: {
        name: true,
        id: true,
      },
    })

    return courses
  }

  async findById(id: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({ where: { id } })

    return course
  }
}
