import { makeOpenCashSessionUseCase } from '@/modules/finance/infra/factories/make-open-cash-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { Money } from '@/core/domain/value-objects/money'

export const OpenSessionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    initialAmount: z.number(),
  })
  const { initialAmount } = bodySchema.parse(request.body)
  const useCase = makeOpenCashSessionUseCase()
  const user = request.user as UserToken
  const { session } = await useCase.execute({
    actorId: user.sub,
    unitId: user.unitId,
    initialAmount: Money.from(initialAmount),
  })

  return reply.status(201).send(session)
}
