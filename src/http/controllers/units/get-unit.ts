import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { makeGetUnitService } from '@/services/@factories/units/make-get-unit-services'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getUnit(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const getUnitService = makeGetUnitService()

  try {
    const { unit } = await getUnitService.execute({ id })

    return reply.status(200).send(unit)
  } catch (error) {
    if (error instanceof UnitNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    console.log(error)

    return reply.status(500).send({ message: 'Internal server error' })
  }
}