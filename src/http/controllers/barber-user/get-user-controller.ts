import { makeGetUserService } from '@/services/@factories/barber-user/make-get-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function GetBarberUserController(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetUserService()
  const { user } = await service.execute({ id })
  if (!user) return reply.status(404).send({ message: 'User not found' })
  return reply.status(200).send(user)
}
