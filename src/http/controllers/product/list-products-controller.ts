import { makeListProductsService } from '@/services/@factories/product/make-list-products'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListProductsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListProductsService()
  const userToken = request.user as UserToken
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    name: z.string().optional(),
  })
  const { withCount, page, perPage, name } = querySchema.parse(request.query)

  const result = await service.execute(userToken, {
    withCount,
    page,
    perPage,
    name,
  })

  if (withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
