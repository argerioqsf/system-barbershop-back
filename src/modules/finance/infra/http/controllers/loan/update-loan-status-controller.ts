import { makeUpdateLoanStatusUseCase } from '@/modules/finance/infra/factories/make-update-loan-status'
import { FastifyReply, FastifyRequest } from 'fastify'
import { LoanStatus, RoleName } from '@prisma/client'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { z } from 'zod'

export const UpdateLoanStatusController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    status: z.nativeEnum(LoanStatus),
  })
  const { id } = paramsSchema.parse(request.params)
  const { status } = bodySchema.parse(request.body)
  const user = request.user as UserToken
  if (
    user.role !== RoleName.ADMIN &&
    user.role !== RoleName.MANAGER &&
    user.role !== RoleName.OWNER
  )
    return reply.status(403).send({ message: 'Unauthorized' })

  const useCase = makeUpdateLoanStatusUseCase()
  const { loan, transactions } = await useCase.execute({
    loanId: id,
    status,
    updatedById: user.sub,
  })

  return reply.status(200).send({
    loan: {
      ...loan,
      amount: loan.amount.toNumber(),
    },
    transactions,
  })
}
