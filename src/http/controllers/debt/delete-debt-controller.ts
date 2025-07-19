import { makeDeleteDebtService } from '@/services/@factories/debt/make-delete-debt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const DeleteDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteDebtService()
  await service.execute({ id })
  return reply.status(204).send()
}
