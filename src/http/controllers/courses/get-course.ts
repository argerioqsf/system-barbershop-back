import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeGetCourseService } from '@/services/@factories/courses/make-get-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getCourse(request: FastifyRequest, reply: FastifyReply) {
  const { id } = routeSchema.parse(request.params)

  const getCourseService = makeGetCourseService()

  try {
    const { course } = await getCourseService.execute({ id })

    return reply.status(200).send({ course })
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
