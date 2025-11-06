import { makeListDebtsQuery } from '@/modules/finance/infra/factories/make-list-debts-query'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentStatus } from '@prisma/client'

export const ListDebtsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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

  const {
    page = 1,
    perPage = 10,
    ...filters
  } = querySchema.parse(request.query)

  const query = makeListDebtsQuery()

  const result = await query.execute({
    actor: request.user,
    filters,
    pagination: { page, perPage },
  })

  if (filters.withCount) {
    return reply.status(200).send(result)
  }

  return reply.status(200).send(result.items)
}
