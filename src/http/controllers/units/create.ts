import { makeCreateUnitService } from '@/services/@factories/units/make-create-unit-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  courseId: z.string(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const { name, courseId } = bodySchema.parse(request.body)

  const createUnitService = makeCreateUnitService()

  try {
    const { unit } = await createUnitService.execute({ name, courseId })

    return reply.status(201).send(unit)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
