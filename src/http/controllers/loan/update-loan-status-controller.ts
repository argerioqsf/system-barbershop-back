import { makeUpdateLoanStatus } from '@/services/@factories/loan/make-update-loan-status'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateLoanStatusController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CANCELED']),
  })
  const { id } = paramsSchema.parse(request.params)
  const { status } = bodySchema.parse(request.body)
  const service = makeUpdateLoanStatus()
  const { loan, transactions } = await service.execute({
    loanId: id,
    status,
    updatedById: request.user.sub,
  })
  return reply.status(200).send({ loan, transactions })
}
