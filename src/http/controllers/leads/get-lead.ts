import { LeadsNotFoundError } from '@/services/@errors/leads-not-found-error'
import makeGetLeadService from '@/services/@factories/leads/make-get-lead-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getLead(request: FastifyRequest, reply: FastifyReply) {
  const { id } = routeSchema.parse(request.params)

  const getLeadService = makeGetLeadService()

  try {
    const { lead } = await getLeadService.execute({ id })

    return reply.status(200).send(lead)
  } catch (error) {
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
