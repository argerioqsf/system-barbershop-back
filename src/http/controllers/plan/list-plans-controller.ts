import { makeListPlansService } from '@/services/@factories/plan/make-list-plans'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { logger } from '@/lib/logger'

export const ListPlansController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const querySchema = z.object({ unitId: z.string().optional() })
  const { unitId: queryUnitId } = querySchema.parse(request.query)
  const user = request.user as UserToken
  const unitId =
    user.role === 'ADMIN' ? queryUnitId ?? user.unitId : user.unitId
  const service = makeListPlansService()
  logger.debug('Listing plans', { unitId })
  const { plans } = await service.execute({ unitId })
  return reply.status(200).send(plans)
}
