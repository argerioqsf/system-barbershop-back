import { LeadsNotFoundError } from '@/services/@errors/leads-not-found-error'
import { SetConsultantNotPermitError } from '@/services/@errors/set-consultant-not-permission'
import makeCreateLeadsService from '@/services/@factories/leads/make-create-leads-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  email: z.string(),
  city: z.string(),
  indicatorId: z.string(),
  consultantId: z.string().optional(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body)

  const userId = request.user.sub

  const createLeadsService = makeCreateLeadsService()

  try {
    const { leads } = await createLeadsService.execute({ ...body, userId })

    return reply.status(201).send(leads)
  } catch (error) {
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof SetConsultantNotPermitError) {
      return reply.status(401).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
