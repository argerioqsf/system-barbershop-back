import { makeListDebtsService } from '@/services/@factories/debt/make-list-debts'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentStatus } from '@prisma/client'

export const ListDebtsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListDebtsService()
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    planId: z.string().optional(),
    planProfileId: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  const params = querySchema.parse(request.query)
  const result = await service.execute(params)
  if (params.withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
