import { makeUpdateBenefitService } from '@/services/@factories/benefit/make-update-benefit'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { DiscountType } from '@prisma/client'

export const UpdateBenefitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    description: z.string().optional().nullable(),
    discount: z.number().optional().nullable(),
    discountType: z.nativeEnum(DiscountType).optional().nullable(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateBenefitService()
  const { benefit } = await service.execute({ id, data })
  return reply.status(200).send(benefit)
}
