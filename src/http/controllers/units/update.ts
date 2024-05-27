import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { makeUpdateUnitService } from '@/services/@factories/units/make-update-unit-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  courses: z.array(z.string()).optional(),
  segments: z.array(z.string()).optional(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const { name, courses, segments } = bodySchema.parse(request.body)

  const updateUnitService = makeUpdateUnitService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { unit } = await updateUnitService.execute({
      id,
      name,
      coursesIds: courses,
      segmentsIds: segments,
    })
    return reply.status(201).send(unit)
  } catch (error) {
    if (error instanceof UnitNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
