import makeCreateCycleService from '@/services/@factories/cycle/make-create-cycle-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const createCycleService = makeCreateCycleService()

  try {
    const { cycle } = await createCycleService.execute()

    return reply.status(201).send(cycle)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
