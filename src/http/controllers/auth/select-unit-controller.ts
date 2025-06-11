import { makeSelectUnitService } from '@/services/@factories/session/make-select-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function SelectUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    unitId: z.string(),
  })
  const { unitId } = bodySchema.parse(request.body)

  const userId = (request.user as any).sub as string

  const service = makeSelectUnitService()
  await service.execute({ userId, unitId })

  const token = await reply.jwtSign({ unitId }, { sign: { sub: userId } })

  return reply.status(200).send({ token })
}
