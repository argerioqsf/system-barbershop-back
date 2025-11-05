import { makeGetDebtUseCase } from '@/modules/finance/infra/factories/make-get-debt'
import { DebtPresenter } from '@/modules/finance/infra/presenters/debt-presenter'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const GetDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const useCase = makeGetDebtUseCase()
  const debt = await useCase.execute(id)
  return reply.status(200).send(debt ? DebtPresenter.toHTTP(debt) : null)
}
