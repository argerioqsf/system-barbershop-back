import { makeDeleteUserService } from '@/services/@factories/barber-user/make-delete-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function DeleteBarberUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteUserService()
  await service.execute({ id })
  return reply.status(204).send()
}
