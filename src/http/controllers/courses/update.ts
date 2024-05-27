import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeUpdateCourseService } from '@/services/@factories/courses/make-update-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  active: z.boolean(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body)

  const updateCourse = makeUpdateCourseService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { course } = await updateCourse.execute({
      ...body,
      id,
    })
    return reply.status(201).send(course)
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
