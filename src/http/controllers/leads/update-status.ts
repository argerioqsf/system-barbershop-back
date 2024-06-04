import { NoActiveCyclesError } from '@/services/@errors/no-active-cycles-error'
import { UserTypeNotCompatible } from '@/services/@errors/user-type-not-compatible'
import makeUpdateLeadStartService from '@/services/@factories/leads/make-update-status-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  documents: z.boolean().optional(),
  matriculation: z.boolean().optional(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function UpdateStatus(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { documents, matriculation } = bodySchema.parse(request.body)

  const updateLeadStatusService = makeUpdateLeadStartService()

  const { id } = routeSchema.parse(request.params)

  const userId = request.user.sub

  try {
    const { lead } = await updateLeadStatusService.execute({
      id,
      documents,
      matriculation,
      userId,
    })
    return reply.status(201).send(lead)
  } catch (error) {
    if (error instanceof UserTypeNotCompatible) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof NoActiveCyclesError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
