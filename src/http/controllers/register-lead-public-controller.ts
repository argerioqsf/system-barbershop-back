import makeCreateLeadPublicService from '@/services/@factories/leads/make-create-lead-public-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  email: z.string(),
  city: z.string(),
  indicatorId: z.string(),
})

export async function RegisterLeadPublicController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body)

  const createLeadPublicService = makeCreateLeadPublicService()

  try {
    const { leads } = await createLeadPublicService.execute({ ...body })

    return reply.status(201).send(leads)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
