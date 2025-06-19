import { withErrorHandling } from '@/utils/http-error-handler'
import { makeSetSaleStatus } from '@/services/@factories/sale/make-set-sale-status'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const SetSaleStatusController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    paymentStatus: z.enum(['PAID', 'PENDING']),
  })
  const { id } = paramsSchema.parse(request.params)
  const { paymentStatus } = bodySchema.parse(request.body)
  const userId = request.user.sub
  const service = makeSetSaleStatus()
  const { sale } = await service.execute({
    saleId: id,
    userId,
    paymentStatus,
  })
  return reply.status(200).send(sale)
})
