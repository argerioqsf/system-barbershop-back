import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { UserToken } from '@/http/controllers/authenticate-controller'
import { makeListSales } from '@/modules/sale/infra/factories/make-list-sales'

export const ListSalesController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListSales()
  const user = request.user as UserToken

  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    clientId: z.string().optional(),
    userId: z.string().optional(),
  })
  const params = querySchema.parse(request.query)
  const result = await service.execute({
    actor: {
      id: user.sub,
      unitId: user.unitId,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions,
    },
    filters: params,
  })
  if (params.withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
