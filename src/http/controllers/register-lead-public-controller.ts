import { LeadsDocumentExistsError } from '@/services/@errors/leads-document-exists-error'
import { LeadsEmailExistsError } from '@/services/@errors/leads-email-exists-error'
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
  unitId: z.string(),
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
    if (error instanceof LeadsDocumentExistsError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof LeadsEmailExistsError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
