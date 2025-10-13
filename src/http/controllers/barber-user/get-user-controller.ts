import { makeGetUserService } from '@/services/@factories/barber-user/make-get-user'
import { makeListUserLoans } from '@/services/@factories/loan/make-list-user-loans'
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

  const loanService = makeListUserLoans()
  const loans = await loanService.execute({ userId: id })

  return reply.status(200).send({ ...user, loans })
}
