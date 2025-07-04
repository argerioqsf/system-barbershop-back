import { makeListUserLoans } from '@/services/@factories/loan/make-list-user-loans'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RoleName } from '@prisma/client'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListUserLoansController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ userId: z.string() })
  const { userId } = paramsSchema.parse(request.params)
  const requester = request.user as UserToken
  if (userId !== requester.sub) {
    const repo = new PrismaBarberUsersRepository()
    const target = await repo.findById(userId)
    if (!target) return reply.status(404).send({ message: 'User not found' })
    if (
      requester.role === RoleName.MANAGER &&
      target.unitId !== requester.unitId
    )
      return reply.status(403).send({ message: 'Unauthorized' })
    if (
      requester.role === RoleName.OWNER &&
      target.organizationId !== requester.organizationId
    )
      return reply.status(403).send({ message: 'Unauthorized' })
  }
  const service = makeListUserLoans()
  const loans = await service.execute({ userId })
  return reply.status(200).send({ loans })
}
