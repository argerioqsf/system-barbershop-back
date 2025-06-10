import { makeListSessionsService } from '@/services/@factories/cash-register/make-list-sessions'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListSessionsController(request: FastifyRequest, reply: FastifyReply) {
  const service = makeListSessionsService()
  const unitId = (request.user as any).unitId as string
  const { sessions } = await service.execute(unitId)
  return reply.status(200).send(sessions)
}
