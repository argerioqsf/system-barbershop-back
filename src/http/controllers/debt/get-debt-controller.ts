import { makeGetDebtService } from '@/services/@factories/debt/make-get-debt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const GetDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetDebtService()
  const { debt } = await service.execute({ id })
  return reply.status(200).send(debt)
}
