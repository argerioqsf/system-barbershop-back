import { makeListBenefitsService } from '@/services/@factories/benefit/make-list-benefits'
import { FastifyRequest, FastifyReply } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListBenefitsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListBenefitsService()
  const user = request.user as UserToken
  const { benefits } = await service.execute(user)
  return reply.status(200).send(benefits)
}
