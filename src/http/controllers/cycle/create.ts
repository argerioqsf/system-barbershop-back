import { OrganizationNotFoundError } from '@/services/@errors/organization-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import makeCreateCycleService from '@/services/@factories/cycle/make-create-cycle-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const createCycleService = makeCreateCycleService()

  const userId = request.user.sub

  try {
    const { cycle } = await createCycleService.execute({ userId })
    return reply.status(201).send(cycle)
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    if (error instanceof OrganizationNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
