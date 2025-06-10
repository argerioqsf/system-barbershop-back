import { makeGetUserService } from '@/services/@factories/barber-user/make-get-user'
import { makeBarberBalance } from '@/services/@factories/report/make-barber-balance'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function GetBarberUserController(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetUserService()
  const { user } = await service.execute({ id })
  if (!user) return reply.status(404).send({ message: 'User not found' })

  const balanceService = makeBarberBalance()
  const { balance } = await balanceService.execute({ barberId: id })

  return reply.status(200).send({ ...user, balance })
}
