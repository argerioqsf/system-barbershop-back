import { makeSearchUnitsService } from '@/services/@factories/units/make-search-units-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
})

export async function Search(request: FastifyRequest, reply: FastifyReply) {
  const { q, page } = searchBodySchema.parse(request.query)

  const searchUnitsService = makeSearchUnitsService()

  try {
    const { units } = await searchUnitsService.execute({
      query: q,
      page,
    })

    return reply.status(200).send({ units })
  } catch (error) {
    console.error(error)

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
