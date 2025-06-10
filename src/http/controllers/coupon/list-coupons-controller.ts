import { makeListCouponsService } from '@/services/@factories/coupon/make-list-coupons'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListCouponsController(_: FastifyRequest, reply: FastifyReply) {
  const service = makeListCouponsService()
  const { coupons } = await service.execute()
  return reply.status(200).send(coupons)
}
