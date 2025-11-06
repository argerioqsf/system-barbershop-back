import { makeGetUserService } from '@/services/@factories/barber-user/make-get-user'
import { makeListUserLoansUseCase } from '@/modules/finance/infra/factories/make-list-user-loans'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetUserService()
  const { user } = await service.execute({ id })
  if (!user) return reply.status(404).send({ message: 'User not found' })

  const listLoansUseCase = makeListUserLoansUseCase()
  const loansSummary = await listLoansUseCase.execute(id)

  return reply.status(200).send({
    ...user,
    loans: {
      pending: loansSummary.pending.map((loan) => ({
        ...loan,
        amount: loan.amount.toNumber(),
        remaining: loan.remaining.toNumber(),
      })),
      paid: loansSummary.paid.map((loan) => ({
        ...loan,
        amount: loan.amount.toNumber(),
      })),
      totalOwed: loansSummary.totalOwed.toNumber(),
    },
  })
}
