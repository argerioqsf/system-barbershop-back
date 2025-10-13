import { FastifyRequest, FastifyReply } from 'fastify'
import { GetOpenSessionService } from '@/services/cash-register/get-open-session'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'

export async function getOpenSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const getOpenSessionService = new GetOpenSessionService(
    cashRegisterRepository,
  )

  const { session } = await getOpenSessionService.execute({
    unitId: request.user.unitId,
  })

  return reply.status(200).send(session)
}
