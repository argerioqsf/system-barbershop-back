import { makeCreateBenefitService } from '@/services/@factories/benefit/make-create-benefit'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { DiscountType } from '@prisma/client'
import { UserToken } from '../authenticate-controller'

export const CreateBenefitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    discount: z.number().optional(),
    discountType: z.nativeEnum(DiscountType).optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateBenefitService()
  const unitId = (request.user as UserToken).unitId
  const { benefit } = await service.execute({ ...data, unitId })
  return reply.status(201).send({ benefit })
}
