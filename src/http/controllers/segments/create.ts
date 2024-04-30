import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeCreateSegmentsService } from '@/services/@factories/segments/make-create-segments-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  courses: z.array(z.string()).optional(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const { name, courses } = bodySchema.parse(request.body)

  const createSegmentService = makeCreateSegmentsService()

  try {
    const { segment } = await createSegmentService.execute({
      name,
      coursesIds: courses,
    })

    return reply.status(201).send({ segment })
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
