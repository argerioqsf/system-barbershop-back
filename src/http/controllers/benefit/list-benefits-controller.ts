import { makeListBenefitsService } from '@/services/@factories/benefit/make-list-benefits'
import { FastifyRequest, FastifyReply } from 'fastify'

export const ListBenefitsController = async (
  _: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListBenefitsService()
  const { benefits } = await service.execute()
  return reply.status(200).send(benefits)
}
