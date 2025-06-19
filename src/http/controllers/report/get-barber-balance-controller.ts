import { makeBarberBalance } from '@/services/@factories/report/make-barber-balance'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetBarberBalanceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ barberId: z.string() })
  const { barberId } = paramsSchema.parse(request.params)
  const service = makeBarberBalance()
  const { balance, historySales } = await service.execute({ barberId })
  return reply.status(200).send({ balance, historySales })
}
