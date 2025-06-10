import { makeOpenSessionService } from '@/services/@factories/cash-register/make-open-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function OpenSessionController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    userId: z.string(),
    initialAmount: z.number(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeOpenSessionService()
  const unitId = (request.user as any).unitId as string
  const { session } = await service.execute({ ...data, unitId })
  return reply.status(201).send(session)
}
