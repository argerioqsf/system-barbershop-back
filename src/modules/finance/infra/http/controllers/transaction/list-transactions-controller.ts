import { makeListTransactionsQuery } from '@/modules/finance/infra/factories/make-list-transactions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { z } from 'zod'

export const ListTransactionsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const query = makeListTransactionsQuery()
  const user = request.user as UserToken

  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
  })
  const params = querySchema.parse(request.query)

  const result = await query.execute({
    actor: user,
    filters: params,
  })

  if (params.withCount) {
    return reply.status(200).send(result)
  }

  return reply.status(200).send(result.items)
}
