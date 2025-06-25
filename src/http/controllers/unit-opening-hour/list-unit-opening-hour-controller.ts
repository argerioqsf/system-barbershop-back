import { makeListUnitOpeningHoursService } from '@/services/@factories/unit/make-list-unit-opening-hours-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListUnitOpeningHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as UserToken
  const service = makeListUnitOpeningHoursService()
  const { openingHours } = await service.execute({ unitId: user.unitId })
  return reply.status(200).send({ openingHours })
}
