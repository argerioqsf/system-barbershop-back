import { makeUpdateLoanStatus } from '@/services/@factories/loan/make-update-loan-status'
import { FastifyReply, FastifyRequest } from 'fastify'
import { LoanStatus, RoleName } from '@prisma/client'
import { UserToken } from '../authenticate-controller'
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

  const service = makeUpdateLoanStatus()
  const { loan, transactions } = await service.execute({
    loanId: id,
    status,
    updatedById: user.sub,
    user,
  })
  return reply.status(200).send({ loan, transactions })
}
