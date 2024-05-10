import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeDeleteCourseService } from '@/services/@factories/courses/make-delete-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function deleteCourse(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const deleteCourseService = makeDeleteCourseService()

  try {
    const { course } = await deleteCourseService.execute({ id })

    return reply.status(200).send({ message: 'course deleted', course })
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
