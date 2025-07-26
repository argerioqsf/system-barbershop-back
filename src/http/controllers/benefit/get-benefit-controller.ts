import { makeGetBenefitService } from '@/services/@factories/benefit/make-get-benefit'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const GetBenefitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetBenefitService()
  const { benefit } = await service.execute({ id })
  return reply.status(200).send(benefit)
}
