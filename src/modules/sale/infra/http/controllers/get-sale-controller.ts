import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeGetSale } from '@/modules/sale/infra/factories/make-get-sale'

export const getSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const useCase = makeGetSale()
  const user = request.user
  const { sale } = await useCase.execute({
    id,
    actor: {
      id: user.sub,
      unitId: user.unitId,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions,
    },
  })

  if (!sale) return reply.status(404).send({ message: 'Sale not found' })
  return reply.status(200).send(sale)
}
