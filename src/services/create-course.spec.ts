import { InMemoryCoursesRepository } from '@/repositories/in-memory/in-memory-course-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateCourseService } from './create-course-service'

describe('Profile use case', () => {
  let coursesRepository: InMemoryCoursesRepository
  let stu: CreateCourseService

  beforeEach(() => {
    coursesRepository = new InMemoryCoursesRepository()
    stu = new CreateCourseService(coursesRepository)
  })

  it('create course', async () => {
    const { course } = await stu.execute({
      name: 'Medic',
      active: true,
    })

    expect(course.id).toEqual(expect.any(String))
  })
})
