import { makeCreateDebtService } from '@/services/@factories/debt/make-create-debt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const CreateDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    value: z.number(),
    planId: z.string(),
    planProfileId: z.string(),
    paymentDate: z.coerce.date(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateDebtService()
  const { debt } = await service.execute({ ...data })
  return reply.status(201).send({ debt })
}
