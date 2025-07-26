import { makeListPlansService } from '@/services/@factories/plan/make-list-plans'
import { FastifyRequest, FastifyReply } from 'fastify'

export const ListPlansController = async (
  _: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListPlansService()
  const { plans } = await service.execute()
  return reply.status(200).send(plans)
}
