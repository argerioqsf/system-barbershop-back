import { makeListCouponsService } from '@/services/@factories/coupon/make-list-coupons'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListCouponsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListCouponsService()
  const user = request.user as UserToken
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    code: z.string().optional(),
  })
  const params = querySchema.parse(request.query)
  const result = await service.execute(user, params)
  if (params.withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
