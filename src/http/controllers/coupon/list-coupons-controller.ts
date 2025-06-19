import { makeListCouponsService } from '@/services/@factories/coupon/make-list-coupons'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListCouponsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListCouponsService()
  const user = request.user as UserToken
  const { coupons } = await service.execute(user)
  return reply.status(200).send(coupons)
}
