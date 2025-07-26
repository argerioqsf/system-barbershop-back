import { makeUpdateDebtService } from '@/services/@factories/debt/make-update-debt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentStatus } from '@prisma/client'

export const UpdateDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    value: z.number().optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    paymentDate: z.coerce.date().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateDebtService()
  const { debt } = await service.execute({ id, data })
  return reply.status(200).send(debt)
}
