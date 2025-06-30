import { makeListUserLoans } from '@/services/@factories/loan/make-list-user-loans'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const ListUserLoansController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ userId: z.string() })
  const { userId } = paramsSchema.parse(request.params)
  const service = makeListUserLoans()
  const loans = await service.execute({ userId })
  return reply.status(200).send({ loans })
}
