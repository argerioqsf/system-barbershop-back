import { LeadAlreadyHasConsultant } from '@/services/@errors/lead-already-has-consultant'
import { LeadsNotFoundError } from '@/services/@errors/leads-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { UserTypeNotCompatible } from '@/services/@errors/user-type-not-compatible'
import makeUpdateAddConsultantLeadService from '@/services/@factories/leads/make-update-add-consultant-lead-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function UpdateAddConsultant(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const updateAddConsultantLeadService = makeUpdateAddConsultantLeadService()

  const { id } = routeSchema.parse(request.params)

  const userId = request.user.sub

  try {
    const { lead } = await updateAddConsultantLeadService.execute({
      id,
      userId,
    })
    return reply.status(201).send(lead)
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof UserTypeNotCompatible) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof LeadAlreadyHasConsultant) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
