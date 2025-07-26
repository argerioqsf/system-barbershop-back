import { makeDeleteBenefitService } from '@/services/@factories/benefit/make-delete-benefit'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const DeleteBenefitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteBenefitService()
  await service.execute({ id })
  return reply.status(204).send()
}
