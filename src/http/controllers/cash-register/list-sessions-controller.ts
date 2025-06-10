import { makeListSessionsService } from '@/services/@factories/cash-register/make-list-sessions'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListSessionsController(request: FastifyRequest, reply: FastifyReply) {
  const service = makeListSessionsService()
  const { sessions } = await service.execute()
  return reply.status(200).send(sessions)
}
