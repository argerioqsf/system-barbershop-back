import makeUpdateArchivedLeadService from '@/services/@factories/leads/make-update-archived-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  archived: z.boolean(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function UpdateArchived(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { archived } = bodySchema.parse(request.body)

  const updateLeadArchivedService = makeUpdateArchivedLeadService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { lead } = await updateLeadArchivedService.execute({
      id,
      archived,
    })
    return reply.status(201).send(lead)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
