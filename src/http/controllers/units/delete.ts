import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { makeDeleteUnitService } from '@/services/@factories/units/make-delete-unit-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function deleteUnit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = routeSchema.parse(request.params)

  const deleteUnitService = makeDeleteUnitService()

  try {
    const { unit } = await deleteUnitService.execute({ id })

    return reply.status(200).send({ unit })
  } catch (error) {
    if (error instanceof UnitNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
