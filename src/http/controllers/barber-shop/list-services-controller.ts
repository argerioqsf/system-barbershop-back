import { makeListServices } from '@/services/@factories/barbershop/make-list-services'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListServicesController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListServices()
  const userToken = request.user as UserToken
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    name: z.string().optional(),
    categoryId: z.string().optional(),
  })
  const params = querySchema.parse(request.query)
  const result = await service.execute(userToken, params)
  if (params.withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
