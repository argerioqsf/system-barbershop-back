import { makeOpenSessionService } from '@/services/@factories/cash-register/make-open-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function OpenSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    initialAmount: z.number(),
  })
  const { initialAmount } = bodySchema.parse(request.body)
  const service = makeOpenSessionService()
  const user = request.user as UserToken
  const { session } = await service.execute({ user, initialAmount })
  return reply.status(201).send(session)
}
