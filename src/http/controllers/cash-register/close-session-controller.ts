import { makeCloseSessionService } from '@/services/@factories/cash-register/make-close-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CloseSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    sessionId: z.string(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCloseSessionService()
  const { session } = await service.execute(data)
  return reply.status(200).send(session)
}
