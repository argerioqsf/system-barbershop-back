import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { makeUpdateSegmentsService } from '@/services/@factories/segments/make-update-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  courses: z.array(z.string()).optional(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const { name, courses } = bodySchema.parse(request.body)

  const updateSegmentService = makeUpdateSegmentsService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { segment } = await updateSegmentService.execute({
      id,
      name,
      coursesIds: courses,
    })
    return reply.status(201).send(segment)
  } catch (error) {
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
