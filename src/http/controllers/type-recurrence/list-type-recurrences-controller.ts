import { makeListTypeRecurrencesService } from '@/services/@factories/type-recurrence/make-list-type-recurrences'
import { FastifyRequest, FastifyReply } from 'fastify'

export const ListTypeRecurrencesController = async (
  _: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListTypeRecurrencesService()
  const { types } = await service.execute()
  return reply.status(200).send(types)
}
