import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { makeCreateUnitService } from '@/services/@factories/units/make-create-unit-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  courses: z.array(z.string()).optional(),
  segments: z.array(z.string()).optional()
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const { name, courses, segments } = bodySchema.parse(request.body)

  const createUnitService = makeCreateUnitService()

  try {
    const { unit } = await createUnitService.execute({ name, coursesIds: courses, segmentsIds: segments })

    return reply.status(201).send(unit)
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: error })
  }
}
