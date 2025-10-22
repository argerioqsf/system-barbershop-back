import { makeUpdateSaleStatusService } from '@/services/@factories/sale/make-update-sale-status-service'
import { PaymentStatus } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateSaleStatusController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({ status: z.nativeEnum(PaymentStatus) })

  const { id } = paramsSchema.parse(request.params)
  const { status } = bodySchema.parse(request.body)

  const service = makeUpdateSaleStatusService()

  const { sale } = await service.execute({ saleId: id, status })

  return reply.status(200).send({ sale })
}
